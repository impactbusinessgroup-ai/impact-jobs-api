// scripts/cleanup-activity-log.js
//
// One-time cleanup of the contact_activity_log Redis key.
// Applies two filters together:
//   1) Remove ALL entries where Mark Sapoznikov is involved (case-insensitive
//      match on msapoznikov@impactbusinessgroup.com against am_email, from_am,
//      or to_am), regardless of date.
//   2) From what remains, remove any entry whose date is before 2026-04-16.
// Writes the filtered array back to the same Redis key, logs the counts, and
// drops a marker so re-runs are no-ops.

require('dotenv').config({ path: '.env.local' });

const MARKER_KEY = 'script_marker:cleanup_activity_log_2026_04_21';
const MARK_EMAIL = 'msapoznikov@impactbusinessgroup.com';
const DATE_CUTOFF = '2026-04-16';

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
  const url = process.env.KV_REST_API_URL + '/set/' + encodeURIComponent(key);
  const body = exSeconds ? { value: JSON.stringify(value), ex: exSeconds } : { value: JSON.stringify(value) };
  await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function isMarkEntry(entry) {
  if (!entry) return false;
  const mark = MARK_EMAIL.toLowerCase();
  const fields = [entry.am_email, entry.from_am, entry.to_am];
  return fields.some(v => String(v || '').toLowerCase() === mark);
}

function entryDateYmd(entry) {
  const d = String((entry && entry.date) || '').slice(0, 10);
  return d || null;
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

  const raw = await redisGet('contact_activity_log');
  if (!Array.isArray(raw)) {
    console.log('contact_activity_log is not an array. type=', typeof raw, 'Nothing to clean.');
    return;
  }

  const totalBefore = raw.length;
  let removedByMark = 0;
  let removedByDate = 0;
  const kept = [];
  const sampleByMark = [];
  const sampleByDate = [];

  for (const e of raw) {
    if (isMarkEntry(e)) {
      removedByMark++;
      if (sampleByMark.length < 3) sampleByMark.push({ action: e.action_type, am: e.am_email || e.from_am || '', to: e.to_am || '', date: entryDateYmd(e) });
      continue;
    }
    const ymd = entryDateYmd(e);
    if (!ymd || ymd < DATE_CUTOFF) {
      removedByDate++;
      if (sampleByDate.length < 3) sampleByDate.push({ action: e.action_type, am: e.am_email || e.from_am || '', date: ymd });
      continue;
    }
    kept.push(e);
  }

  await redisSet('contact_activity_log', kept);
  await redisSet(MARKER_KEY, { ranAt: new Date().toISOString(), totalBefore, removedByMark, removedByDate, kept: kept.length }, 60 * 60 * 24 * 365);

  console.log('========== Cleanup Report ==========');
  console.log('Total entries before:          ', totalBefore);
  console.log('Removed (Mark filter):         ', removedByMark);
  console.log('Removed (pre-' + DATE_CUTOFF + ' date filter):', removedByDate);
  console.log('Remaining:                     ', kept.length);
  if (sampleByMark.length) {
    console.log('\nSample Mark-filter removals (first 3):');
    sampleByMark.forEach(s => console.log(' ', JSON.stringify(s)));
  }
  if (sampleByDate.length) {
    console.log('\nSample date-filter removals (first 3):');
    sampleByDate.forEach(s => console.log(' ', JSON.stringify(s)));
  }
  if (kept.length) {
    const byAm = {};
    const byAction = {};
    kept.forEach(e => {
      const am = (e.am_email || e.to_am || e.from_am || '(unknown)').toLowerCase();
      byAm[am] = (byAm[am] || 0) + 1;
      byAction[e.action_type || '(unknown)'] = (byAction[e.action_type || '(unknown)'] || 0) + 1;
    });
    console.log('\nRemaining by AM:');
    Object.keys(byAm).sort().forEach(a => console.log('  ' + a.padEnd(45) + ' : ' + byAm[a]));
    console.log('\nRemaining by action_type:');
    Object.keys(byAction).sort().forEach(a => console.log('  ' + a.padEnd(20) + ' : ' + byAction[a]));
  }
  console.log('\nMarker stored at', MARKER_KEY);
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
