// scripts/redistribute-and-reset.js
//
// One-time bulk redistribute + activity-clock reset for 2026-04-21:
//   1) For every ACTIVE lead (status in new/pending/in_progress) currently
//      assigned to Mark Sapoznikov, Matt Peal, OR carrying an inactivity
//      reassignment in its history, re-run the new round-robin routing
//      (Mailchimp REP override first, then category-pool load balancing).
//   2) For every active-or-awaiting_followup lead, reset assignedAt to now
//      so the 2-business-day inactivity clock starts fresh today. Completion
//      dates and follow-up reminder schedules are NOT touched.
//   3) Delete the retired debug Redis keys (filter_rejection_log,
//      contacts_fetch_debug).
//   4) Drop a Redis marker so re-runs are no-ops.

require('dotenv').config({ path: '.env.local' });

const path = require('path');
const { assignAM } = require(path.join('..', 'api', '_routing'));

const MARKER_KEY = 'script_marker:redistribute_and_reset_2026_04_21';
const MARK_EMAIL = 'msapoznikov@impactbusinessgroup.com';
const MATT_EMAIL = 'mpeal@impactbusinessgroup.com';
const ACTIVE_STATUSES_REDISTRIBUTE = new Set(['new', 'pending', 'in_progress']);
const ACTIVE_STATUSES_RESET = new Set(['new', 'pending', 'in_progress', 'awaiting_followup']);

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
async function redisKeys(pattern) {
  const url = process.env.KV_REST_API_URL + '/keys/' + encodeURIComponent(pattern);
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN } });
  const data = await res.json();
  return data.result || [];
}
async function redisDel(key) {
  const url = process.env.KV_REST_API_URL + '/del/' + encodeURIComponent(key);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN },
  });
  return res.ok;
}

function isInactivityRouted(lead) {
  return Array.isArray(lead.assignment_history) && lead.assignment_history.some(h =>
    String((h && h.reassign_reason) || '').toLowerCase().indexOf('inactivity') !== -1
  );
}
function isLocalize(loc) { return /tampa/i.test(String(loc || '')) ? 'Tampa' : (/florida/i.test(String(loc||'')) ? 'Florida (non-Tampa)' : 'Michigan/Other'); }

async function main() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error('Missing KV_REST_API_URL / KV_REST_API_TOKEN');
    process.exit(1);
  }

  const marker = await redisGet(MARKER_KEY);
  if (marker) {
    console.log('Marker present (' + MARKER_KEY + '):', JSON.stringify(marker));
    console.log('Bulk redistribute already ran. Exiting without changes.');
    return;
  }

  console.log('Loading all lead:* keys...');
  const keys = await redisKeys('lead:*');
  console.log('Found', keys.length, 'lead keys. Hydrating...');
  const allLeads = [];
  for (const k of keys) {
    const l = await redisGet(k);
    if (l) { l._key = k; allLeads.push(l); }
  }
  console.log('Hydrated', allLeads.length, 'leads.');

  // ---------- Step 1: redistribute ----------
  const candidates = allLeads.filter(l => {
    if (!ACTIVE_STATUSES_REDISTRIBUTE.has(l.status)) return false;
    const em = (l.assignedAMEmail || '').toLowerCase();
    if (em === MARK_EMAIL || em === MATT_EMAIL) return true;
    if (isInactivityRouted(l)) return true;
    return false;
  });
  // Deterministic order keeps load-balancing reproducible.
  candidates.sort((a, b) => String(a.id || a._key).localeCompare(String(b.id || b._key)));

  console.log('\n--- Step 1: Redistribute ---');
  console.log('Candidates for redistribute:', candidates.length);

  const nowIso = new Date().toISOString();
  const distribution = {};            // by AM email
  const byAmCategory = {};            // am_email -> { category -> count }
  const byAmLocale = {};              // am_email -> { locale -> count }
  const sourceCounts = {};            // mailchimp / round-robin-* counts
  let redistributed = 0;
  let routingFailures = 0;

  for (const lead of candidates) {
    const prevAM = lead.assignedAM || '';
    const prevEmail = (lead.assignedAMEmail || '').toLowerCase();

    // Temporarily blank the candidate's assignment so the load-balancer
    // doesn't count this lead toward the AM it's leaving.
    lead.assignedAMEmail = '';
    lead.assignedAM = '';

    const route = await assignAM({
      category: lead.category,
      location: lead.location,
      company: lead.company,
      allLeads,
    });
    if (!route) {
      routingFailures++;
      lead.assignedAM = prevAM;
      lead.assignedAMEmail = prevEmail;
      continue;
    }

    if (!Array.isArray(lead.assignment_history)) lead.assignment_history = [];
    lead.assignment_history.push({
      am_name: prevAM,
      am_email: prevEmail,
      assigned_at: lead.assignedAt || (lead.createdAt ? new Date(lead.createdAt).toISOString() : nowIso),
      reassign_reason: 'bulk_redistribute_2026_04_21',
    });
    lead.assignedAM = route.name;
    lead.assignedAMEmail = route.email;
    lead.assignedAt = nowIso;

    await redisSet(lead._key, _strip(lead), 60 * 60 * 24 * 14);

    distribution[route.email] = (distribution[route.email] || 0) + 1;
    const cat = lead.category || 'unknown';
    byAmCategory[route.email] = byAmCategory[route.email] || {};
    byAmCategory[route.email][cat] = (byAmCategory[route.email][cat] || 0) + 1;
    const locale = isLocalize(lead.location);
    byAmLocale[route.email] = byAmLocale[route.email] || {};
    byAmLocale[route.email][locale] = (byAmLocale[route.email][locale] || 0) + 1;
    sourceCounts[route.source] = (sourceCounts[route.source] || 0) + 1;

    redistributed++;
  }

  // ---------- Step 2: reset activity clock on every active lead ----------
  console.log('\n--- Step 2: Reset activity clocks ---');
  let clocksReset = 0;
  let alreadyReset = 0;
  for (const lead of allLeads) {
    if (!ACTIVE_STATUSES_RESET.has(lead.status)) continue;
    if (lead.assignedAt === nowIso) { alreadyReset++; continue; }
    lead.assignedAt = nowIso;
    await redisSet(lead._key, _strip(lead), 60 * 60 * 24 * 14);
    clocksReset++;
  }

  // ---------- Step 3: drop retired debug Redis keys ----------
  console.log('\n--- Step 3: Delete retired debug keys ---');
  const filterDel = await redisDel('filter_rejection_log');
  const contactsDel = await redisDel('contacts_fetch_debug');
  console.log('filter_rejection_log deleted:', filterDel);
  console.log('contacts_fetch_debug deleted:', contactsDel);

  // ---------- Step 4: marker ----------
  await redisSet(MARKER_KEY, {
    ranAt: nowIso,
    redistributed,
    routingFailures,
    clocksReset,
    alreadyReset,
    candidatesScanned: candidates.length,
    totalLeads: allLeads.length,
  }, 60 * 60 * 24 * 365);

  // ---------- Report ----------
  console.log('\n========== REPORT ==========');
  console.log('Total leads scanned:           ', allLeads.length);
  console.log('Candidates for redistribute:   ', candidates.length);
  console.log('Successfully redistributed:    ', redistributed);
  console.log('Routing failures (kept prev):  ', routingFailures);
  console.log('Activity clocks reset:         ', clocksReset, '  (already-current:', alreadyReset + ')');

  console.log('\nRedistribute source breakdown:');
  Object.keys(sourceCounts).sort().forEach(s => console.log('  ' + s.padEnd(28) + ' : ' + sourceCounts[s]));

  console.log('\nFinal redistribution by AM (count):');
  const amSorted = Object.keys(distribution).sort((a, b) => distribution[b] - distribution[a]);
  amSorted.forEach(em => console.log('  ' + em.padEnd(45) + ' : ' + distribution[em]));

  console.log('\nFinal redistribution by AM x category:');
  amSorted.forEach(em => {
    const cats = byAmCategory[em] || {};
    const parts = Object.keys(cats).sort().map(c => c + '=' + cats[c]).join(', ');
    console.log('  ' + em.padEnd(45) + ' : ' + parts);
  });

  console.log('\nFinal redistribution by AM x location bucket:');
  amSorted.forEach(em => {
    const locs = byAmLocale[em] || {};
    const parts = Object.keys(locs).sort().map(l => l + '=' + locs[l]).join(', ');
    console.log('  ' + em.padEnd(45) + ' : ' + parts);
  });

  console.log('\nMarker stored at', MARKER_KEY);
  console.log('NOTE: Mailchimp REP fields are NOT auto-synced by this script.');
  console.log('      They will refresh as each AM next interacts with their contacts.');
}

// Drop the in-memory _key field before persisting.
function _strip(lead) {
  const { _key, ...rest } = lead;
  return rest;
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
