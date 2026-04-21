// api/_routing.js
// Shared lead-assignment helper used by api/jobs-fetch.js and the
// scripts/redistribute-and-reset.js bulk redistribute.
//
// Routing order:
//   1) Mailchimp REP override -- if any contact at the company in the Clients
//      audience has a populated REPNAME, route to that AM (if multiple AMs
//      have contacts, pick the one with the most contacts at the company).
//      Excluded AMs (admins, on-leave) are skipped even if they're the rep.
//   2) Pool-based load-balanced round robin -- count active leads (status in
//      new / pending / in_progress) per AM in the eligible pool, pick the AM
//      with the fewest. Tiebreak alphabetically.
//
// Tampa leads (location contains "Tampa") always route to Mark Herman /
// Drew Bentsen regardless of category.
//
// Excluded from all rotation: Mark Sapoznikov, Matt Peal (admin), Drew Kunkel (on leave).

const _amData = require('./_am_data');

const POOLS = {
  engineering: ['Douglas Koetsier', 'Paul Kujawski', 'Dan Teliczan', 'Steve Betteley'],
  it:          ['Curt Willbrandt', 'Dan Teliczan', 'Douglas Koetsier', 'Jamie Drajka', 'Steve Betteley', 'Trish Wangler'],
  accounting:  ['Lauren Sylvester'],
  other:       ['Lauren Sylvester', 'Trish Wangler'],
};
const TAMPA_AMS = ['Drew Bentsen', 'Mark Herman'];
const EXCLUDED_AMS = new Set(['Mark Sapoznikov', 'Matt Peal', 'Drew Kunkel']);

function isTampaLocation(loc) {
  return !!loc && /tampa/i.test(String(loc));
}

function emailForName(name) {
  const am = _amData.byName(name);
  return am ? am.email.toLowerCase() : '';
}

function poolFor(category, location) {
  if (isTampaLocation(location)) return TAMPA_AMS.slice();
  const cat = String(category || 'engineering').toLowerCase();
  return (POOLS[cat] || POOLS.engineering).slice();
}

function eligibleNames(pool) {
  return pool.filter(n => !EXCLUDED_AMS.has(n));
}

// Count active (new/pending/in_progress) leads per AM email across allLeads.
function buildActiveCounts(allLeads) {
  const counts = {};
  for (const l of allLeads || []) {
    if (!l) continue;
    const st = l.status;
    if (st !== 'new' && st !== 'pending' && st !== 'in_progress') continue;
    const em = (l.assignedAMEmail || '').toLowerCase();
    if (!em) continue;
    counts[em] = (counts[em] || 0) + 1;
  }
  return counts;
}

function pickLoadBalanced(eligible, counts) {
  if (!eligible.length) return null;
  const sorted = eligible.slice().sort();
  let best = null;
  let bestCount = Infinity;
  for (const name of sorted) {
    const em = emailForName(name);
    const c = counts[em] || 0;
    if (c < bestCount) { bestCount = c; best = name; }
  }
  return best;
}

// --- Mailchimp REP override ---
async function findMailchimpRep(company) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  if (!apiKey || !company) return null;
  const dc = apiKey.split('-')[1];
  const audiences = [
    process.env.MAILCHIMP_CLIENT_AUDIENCE_ID,
    process.env.MAILCHIMP_AUDIENCE_ID_2,
  ].filter(Boolean);
  const repCounts = {};
  for (const audId of audiences) {
    try {
      const url = `https://${dc}.api.mailchimp.com/3.0/search-members?query=${encodeURIComponent(company)}&list_id=${audId}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
      if (!res.ok) continue;
      const data = await res.json();
      const exact = (data.exact_matches && data.exact_matches.members) || [];
      const fuzzy = (data.full_search && data.full_search.members) || [];
      const all = exact.concat(fuzzy);
      const matches = all.filter(m => {
        const co = (m.merge_fields && m.merge_fields.COMPANY || '').toLowerCase();
        return co === String(company).toLowerCase();
      });
      for (const m of matches) {
        const repName = m.merge_fields && m.merge_fields.REPNAME;
        if (repName) repCounts[repName] = (repCounts[repName] || 0) + 1;
      }
    } catch (e) { /* swallow per-audience errors so routing falls through to round-robin */ }
  }
  let bestRep = null;
  let bestCount = 0;
  for (const rep in repCounts) {
    if (repCounts[rep] > bestCount) { bestCount = repCounts[rep]; bestRep = rep; }
  }
  if (!bestRep) return null;
  const am = _amData.byName(bestRep);
  if (!am) return null;
  if (EXCLUDED_AMS.has(am.name)) return null;
  return { name: am.name, email: am.email.toLowerCase(), source: 'mailchimp', repCount: bestCount };
}

// Main entry. Returns { name, email, source } or null.
async function assignAM({ category, location, company, allLeads, useMailchimp = true }) {
  if (useMailchimp && company) {
    const mcRep = await findMailchimpRep(company);
    if (mcRep) return mcRep;
  }
  const pool = poolFor(category, location);
  const eligible = eligibleNames(pool);
  if (!eligible.length) return null;
  const counts = buildActiveCounts(allLeads || []);
  const name = pickLoadBalanced(eligible, counts);
  if (!name) return null;
  return { name, email: emailForName(name), source: isTampaLocation(location) ? 'round-robin-tampa' : 'round-robin-' + (category || 'engineering').toLowerCase() };
}

module.exports = {
  assignAM,
  findMailchimpRep,
  isTampaLocation,
  POOLS,
  TAMPA_AMS,
  EXCLUDED_AMS,
};
