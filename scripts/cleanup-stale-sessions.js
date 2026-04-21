// scripts/cleanup-stale-sessions.js
//
// One-time cleanup of session:* records whose lastSeen is older than 24 hours.
// These accumulated for ~1 month because the previous redisSet helper passed
// {value, ex} as a JSON body, which Upstash stored verbatim and silently
// dropped the TTL. After the redisSet fix new sessions expire correctly; this
// script clears the legacy backlog. Marker-guarded.

require('dotenv').config({ path: '.env.local' });

const MARKER_KEY = 'script_marker:cleanup_stale_sessions_2026_04_21';
const STALE_MS = 24 * 60 * 60 * 1000;

async function redisGet(key) {
  const url = process.env.KV_REST_API_URL + '/get/' + encodeURIComponent(key);
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN } });
  const data = await res.json();
  if (!data.result) return null;
  let value = data.result;
  while (typeof value === 'string') { try { value = JSON.parse(value); } catch (e) { break; } }
  if (value && typeof value.value === 'string') { try { value = JSON.parse(value.value); } catch (e) {} }
  return value;
}
async function redisSet(key, value, exSeconds) {
  let url = process.env.KV_REST_API_URL + '/set/' + encodeURIComponent(key);
  if (exSeconds) url += '?EX=' + encodeURIComponent(exSeconds);
  await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN, 'Content-Type': 'text/plain' },
    body: JSON.stringify(value),
  });
}
async function redisKeys(p) {
  const url = process.env.KV_REST_API_URL + '/keys/' + encodeURIComponent(p);
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN } });
  const data = await res.json();
  return data.result || [];
}
async function redisDel(key) {
  const url = process.env.KV_REST_API_URL + '/del/' + encodeURIComponent(key);
  const res = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN } });
  return res.ok;
}

async function main() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error('Missing KV_REST_API_URL / KV_REST_API_TOKEN');
    process.exit(1);
  }
  const marker = await redisGet(MARKER_KEY);
  if (marker) {
    console.log('Marker present (' + MARKER_KEY + '):', JSON.stringify(marker));
    console.log('Cleanup already ran. Exiting without changes.');
    return;
  }

  const cutoff = Date.now() - STALE_MS;
  const keys = await redisKeys('session:*');
  console.log('session:* keys found:', keys.length);

  let deleted = 0;
  let kept = 0;
  let nullSessions = 0;
  const deletedSamples = [];

  for (const k of keys) {
    const s = await redisGet(k);
    if (!s) {
      // Empty / unparseable record — drop it.
      await redisDel(k);
      nullSessions++;
      deleted++;
      continue;
    }
    const lastSeen = Number(s.lastSeen) || 0;
    if (lastSeen && lastSeen < cutoff) {
      const ageH = Math.round((Date.now() - lastSeen) / 3600000);
      if (deletedSamples.length < 10) deletedSamples.push({ key: k, ageHours: ageH, email: s.subscriber && s.subscriber.email_address, alerted: !!s.alerted });
      await redisDel(k);
      deleted++;
    } else {
      kept++;
    }
  }

  await redisSet(MARKER_KEY, {
    ranAt: new Date().toISOString(),
    scanned: keys.length,
    deleted,
    nullSessions,
    kept,
  }, 60 * 60 * 24 * 365);

  console.log('\n========== REPORT ==========');
  console.log('Scanned:                 ', keys.length);
  console.log('Deleted (>24h or empty): ', deleted);
  console.log('  of which null/empty:   ', nullSessions);
  console.log('Kept (recent):           ', kept);
  if (deletedSamples.length) {
    console.log('\nSample deletions (up to 10):');
    deletedSamples.forEach(s => console.log('  -', s.key.padEnd(28), '| age=' + s.ageHours + 'h | email=' + (s.email||'(none)') + ' | alerted=' + s.alerted));
  }
  console.log('\nMarker stored at', MARKER_KEY);
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
