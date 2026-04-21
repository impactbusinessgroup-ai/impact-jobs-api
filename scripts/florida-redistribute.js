// scripts/florida-redistribute.js
//
// One-time redistribute of Florida leads currently held by anyone OTHER than
// Drew Bentsen / Mark Herman to the Drew/Mark H rotation. Triggered by the
// 2026-04-21 routing rule expansion (isTampaLocation -> isFloridaLocation).
// Marker-guarded so re-running is a no-op.

require('dotenv').config({ path: '.env.local' });

const path = require('path');
const { assignAM, isFloridaLocation, FLORIDA_AMS } = require(path.join('..', 'api', '_routing'));
const _amData = require(path.join('..', 'api', '_am_data'));

const MARKER_KEY = 'script_marker:florida_redistribute_2026_04_21';
const ACTIVE = new Set(['new', 'pending', 'in_progress']);
const FL_AM_EMAILS = new Set(FLORIDA_AMS.map(n => (_amData.byName(n) || {}).email).filter(Boolean).map(e => e.toLowerCase()));

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

async function main() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error('Missing KV_REST_API_URL / KV_REST_API_TOKEN'); process.exit(1);
  }
  const marker = await redisGet(MARKER_KEY);
  if (marker) {
    console.log('Marker present (' + MARKER_KEY + '):', JSON.stringify(marker));
    console.log('Florida redistribute already ran. Exiting without changes.');
    return;
  }

  console.log('Loading all lead:* keys...');
  const keys = await redisKeys('lead:*');
  console.log('Found', keys.length, 'lead keys. Hydrating...');
  const allLeads = [];
  for (const k of keys) {
    const l = await redisGet(k);
    if (!l) continue;
    l._key = k;
    allLeads.push(l);
  }
  console.log('Hydrated', allLeads.length, 'leads.');

  // Candidates: active + Florida + NOT already on Drew or Mark H.
  const candidates = allLeads.filter(l => {
    if (!ACTIVE.has(l.status)) return false;
    if (!isFloridaLocation(l.location)) return false;
    const em = (l.assignedAMEmail || '').toLowerCase();
    return !FL_AM_EMAILS.has(em);
  });

  console.log('\nCandidates (active FL leads not on Drew or Mark H):', candidates.length);
  candidates.sort((a, b) => String(a.id || a._key).localeCompare(String(b.id || b._key)));

  const nowIso = new Date().toISOString();
  const distribution = {};
  const moved = [];
  let routingFailures = 0;

  for (const lead of candidates) {
    const prevAM = lead.assignedAM || '';
    const prevEmail = (lead.assignedAMEmail || '').toLowerCase();

    // Blank current assignment so the load-balancer doesnt count this lead toward the previous AM.
    lead.assignedAMEmail = '';
    lead.assignedAM = '';

    const route = await assignAM({
      category: lead.category,
      location: lead.location,
      company: lead.company,
      allLeads,
    });
    if (!route || !FL_AM_EMAILS.has((route.email || '').toLowerCase())) {
      // Mailchimp REP override or Drew-exclusive zone might have produced a non-FL-pool result.
      // Force the FL pool by passing useMailchimp:false so we strictly land on Drew/Mark H.
      const forced = await assignAM({
        category: lead.category,
        location: lead.location,
        company: lead.company,
        allLeads,
        useMailchimp: false,
      });
      if (!forced || !FL_AM_EMAILS.has((forced.email || '').toLowerCase())) {
        routingFailures++;
        lead.assignedAM = prevAM; lead.assignedAMEmail = prevEmail;
        continue;
      }
      Object.assign(route || {}, forced);
      route.name = forced.name; route.email = forced.email; route.source = forced.source + ' (forced FL pool)';
    }

    if (!Array.isArray(lead.assignment_history)) lead.assignment_history = [];
    lead.assignment_history.push({
      am_name: prevAM,
      am_email: prevEmail,
      assigned_at: lead.assignedAt || (lead.createdAt ? new Date(lead.createdAt).toISOString() : nowIso),
      reassign_reason: 'florida_redistribute_2026_04_21',
    });
    lead.assignedAM = route.name;
    lead.assignedAMEmail = route.email;
    lead.assignedAt = nowIso;

    const { _key, ...persisted } = lead;
    await redisSet(_key, persisted, 60 * 60 * 24 * 14);

    distribution[route.email] = (distribution[route.email] || 0) + 1;
    moved.push({
      key: _key,
      company: lead.company || '',
      city: (String(lead.location || '').split(',')[0] || '').trim(),
      location: lead.location || '',
      category: lead.category || '',
      from: prevAM || prevEmail || '(unknown)',
      to: route.name,
    });
  }

  await redisSet(MARKER_KEY, {
    ranAt: nowIso,
    candidatesScanned: candidates.length,
    moved: moved.length,
    routingFailures,
    distribution,
  }, 60 * 60 * 24 * 365);

  console.log('\n========== REPORT ==========');
  console.log('Active FL leads not on FL pool: ', candidates.length);
  console.log('Successfully reassigned:        ', moved.length);
  console.log('Routing failures:               ', routingFailures);

  console.log('\nDistribution:');
  Object.keys(distribution).sort().forEach(em => console.log('  ' + em.padEnd(45) + ' : ' + distribution[em]));

  if (moved.length) {
    console.log('\nPer-lead detail:');
    moved.forEach(m => console.log('  -', m.company.padEnd(36), '| ' + (m.location || '').padEnd(28), '| ' + m.category.padEnd(11), '| from ' + m.from.padEnd(20), '-> ' + m.to));
  }
  console.log('\nMarker stored at', MARKER_KEY);
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
