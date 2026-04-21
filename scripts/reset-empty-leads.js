// scripts/reset-empty-leads.js
//
// One-time reset: find all leads with contacts.length === 0 AND status === 'new',
// clear contactsEnrichedAt so the next contacts-fetch cron picks them back up
// with the new US-first Apollo logic. Logs how many leads were reset and writes
// a Redis marker so re-running this script is a no-op.

require('dotenv').config({ path: '.env.local' });

const MARKER_KEY = 'script_marker:reset_empty_leads_2026_04_21';

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
  const body = exSeconds
    ? { value: JSON.stringify(value), ex: exSeconds }
    : { value: JSON.stringify(value) };
  await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function redisKeys(pattern) {
  const url = process.env.KV_REST_API_URL + '/keys/' + encodeURIComponent(pattern);
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN } });
  const data = await res.json();
  return data.result || [];
}

async function main() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error('Missing KV_REST_API_URL / KV_REST_API_TOKEN');
    process.exit(1);
  }

  const marker = await redisGet(MARKER_KEY);
  if (marker) {
    console.log('Marker present (' + MARKER_KEY + '):', JSON.stringify(marker));
    console.log('Script already ran. Exiting without changes.');
    return;
  }

  const keys = await redisKeys('lead:*');
  console.log('Scanning ' + keys.length + ' lead keys...');

  let reset = 0;
  let scanned = 0;
  const resetCompanies = [];

  for (const key of keys) {
    const lead = await redisGet(key);
    scanned++;
    if (!lead) continue;
    if (lead.status !== 'new') continue;
    const contactsLen = Array.isArray(lead.contacts) ? lead.contacts.length : 0;
    if (contactsLen !== 0) continue;

    lead.contactsEnrichedAt = null;
    await redisSet(key, lead, 1209600);
    reset++;
    resetCompanies.push(lead.company || key);
  }

  await redisSet(MARKER_KEY, { ranAt: new Date().toISOString(), resetCount: reset }, 60 * 60 * 24 * 90);

  console.log('---');
  console.log('Scanned:', scanned);
  console.log('Reset:', reset);
  if (resetCompanies.length) {
    console.log('Companies reset:');
    resetCompanies.forEach(c => console.log('  -', c));
  }
  console.log('Marker stored at', MARKER_KEY);
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
