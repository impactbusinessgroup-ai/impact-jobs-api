// scripts/mailchimp-backfill.js
//
// One-time backfill of REP fields (REPNAME, REPTITLE, REPEMAIL, REPPHONE,
// CALENDLY) for Mailchimp Clients-audience members added in the last 14 days
// with tag 'BD Pipeline'. AM lookup priority:
//   1. Matching Redis lead (by lead-contact email OR by company name)
//   2. Sibling Mailchimp contact at same company with REPNAME already set
//   3. Skip
// Rep fields are sourced from the consolidated api/_am_data.js directory.
// A Redis marker prevents re-runs.

require('dotenv').config({ path: '.env.local' });

const crypto = require('crypto');
const { AMS, byEmail, byName } = require('../api/_am_data');

const MARKER_KEY = 'script_marker:mailchimp_rep_backfill_2026_04_21';
const AUDIENCE_ID = '71448a78fe';
const TAG_NAME = 'BD Pipeline';
const DAYS_BACK = 14;

const apiKey = process.env.MAILCHIMP_API_KEY;
const dc = apiKey ? apiKey.split('-')[1] : null;

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

async function fetchRecentBdContacts() {
  // Pull recently-added members, then filter by tag client-side. Mailchimp's
  // tag-filter API requires a numeric tag segment id; date + tag-name filter
  // is simplest done in two steps for a one-time backfill.
  const since = new Date(Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000).toISOString();
  const all = [];
  let offset = 0;
  const count = 500;
  while (true) {
    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members` +
      `?since_timestamp_opt=${encodeURIComponent(since)}` +
      `&count=${count}&offset=${offset}` +
      `&fields=members.email_address,members.merge_fields,members.tags,members.timestamp_opt,total_items`;
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + apiKey } });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Mailchimp list fetch failed: ' + res.status + ' ' + txt.slice(0, 200));
    }
    const data = await res.json();
    const batch = data.members || [];
    all.push(...batch);
    if (batch.length < count) break;
    offset += count;
  }
  // Filter by tag (case-insensitive match on tag name)
  return all.filter(m => Array.isArray(m.tags) && m.tags.some(t => (t.name || '').toLowerCase() === TAG_NAME.toLowerCase()));
}

async function fetchAllMembersByCompany() {
  // Build a per-company map of all Clients-audience members so we can find
  // sibling contacts (with populated REPNAME) for the fallback lookup.
  // Pulls the full list once.
  const byCompany = {};
  let offset = 0;
  const count = 1000;
  while (true) {
    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members` +
      `?count=${count}&offset=${offset}` +
      `&fields=members.email_address,members.merge_fields`;
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + apiKey } });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Mailchimp full list fetch failed: ' + res.status + ' ' + txt.slice(0, 200));
    }
    const data = await res.json();
    const batch = data.members || [];
    for (const m of batch) {
      const co = ((m.merge_fields && m.merge_fields.COMPANY) || '').toLowerCase().trim();
      if (!co) continue;
      (byCompany[co] = byCompany[co] || []).push(m);
    }
    if (batch.length < count) break;
    offset += count;
  }
  return byCompany;
}

async function loadAllLeads() {
  const keys = await redisKeys('lead:*');
  const leads = [];
  for (const key of keys) {
    const lead = await redisGet(key);
    if (lead) leads.push(lead);
  }
  return leads;
}

function findAmFromLeads(member, leads) {
  const memberEmail = (member.email_address || '').toLowerCase();
  const memberCompany = ((member.merge_fields && member.merge_fields.COMPANY) || '').toLowerCase().trim();
  if (!memberEmail && !memberCompany) return null;
  // Pass 1: contact-email match
  for (const lead of leads) {
    if (!Array.isArray(lead.contacts)) continue;
    const hit = lead.contacts.find(c => (c.email || '').toLowerCase() === memberEmail);
    if (hit && lead.assignedAMEmail) return lead.assignedAMEmail.toLowerCase();
  }
  // Pass 2: company-name match
  if (memberCompany) {
    for (const lead of leads) {
      if ((lead.company || '').toLowerCase().trim() === memberCompany && lead.assignedAMEmail) {
        return lead.assignedAMEmail.toLowerCase();
      }
    }
  }
  return null;
}

function findAmFromSiblings(member, byCompany) {
  const co = ((member.merge_fields && member.merge_fields.COMPANY) || '').toLowerCase().trim();
  if (!co || !byCompany[co]) return null;
  const memberEmail = (member.email_address || '').toLowerCase();
  for (const sibling of byCompany[co]) {
    if ((sibling.email_address || '').toLowerCase() === memberEmail) continue;
    const repName = sibling.merge_fields && sibling.merge_fields.REPNAME;
    const repEmail = sibling.merge_fields && sibling.merge_fields.REPEMAIL;
    if (repEmail && byEmail(repEmail)) return repEmail.toLowerCase();
    if (repName) {
      const am = byName(repName);
      if (am) return am.email.toLowerCase();
    }
  }
  return null;
}

async function patchRepFields(member, am) {
  const emailHash = crypto.createHash('md5').update((member.email_address || '').toLowerCase()).digest('hex');
  const url = `https://${dc}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members/${emailHash}`;
  const body = {
    merge_fields: {
      REPNAME: am.name,
      REPTITLE: am.title,
      REPEMAIL: am.email,
      REPPHONE: am.phone,
      CALENDLY: am.calendly,
    },
  };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('PATCH failed ' + res.status + ': ' + txt.slice(0, 200));
  }
  return true;
}

async function main() {
  if (!apiKey) { console.error('Missing MAILCHIMP_API_KEY'); process.exit(1); }
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error('Missing KV_REST_API_URL / KV_REST_API_TOKEN'); process.exit(1);
  }

  const marker = await redisGet(MARKER_KEY);
  if (marker) {
    console.log('Marker present (' + MARKER_KEY + '):', JSON.stringify(marker));
    console.log('Backfill already ran. Exiting without changes.');
    return;
  }

  console.log('Fetching recent BD Pipeline contacts (last ' + DAYS_BACK + ' days)...');
  const recent = await fetchRecentBdContacts();
  console.log('Recent BD Pipeline contacts:', recent.length);

  console.log('Loading all leads from Redis...');
  const leads = await loadAllLeads();
  console.log('Leads loaded:', leads.length);

  console.log('Building company -> members map from Mailchimp...');
  const byCompany = await fetchAllMembersByCompany();
  console.log('Companies in audience:', Object.keys(byCompany).length);

  let processed = 0;
  let updated = 0;
  const skipped = [];

  for (const member of recent) {
    processed++;
    const memberEmail = member.email_address || '';
    const memberCompany = (member.merge_fields && member.merge_fields.COMPANY) || '';

    let amEmail = findAmFromLeads(member, leads);
    let source = 'redis_lead';
    if (!amEmail) {
      amEmail = findAmFromSiblings(member, byCompany);
      source = 'mailchimp_sibling';
    }
    if (!amEmail) {
      skipped.push({ email: memberEmail, company: memberCompany, reason: 'no_am_found' });
      continue;
    }
    const am = byEmail(amEmail);
    if (!am) {
      skipped.push({ email: memberEmail, company: memberCompany, reason: 'am_not_in_directory:' + amEmail });
      continue;
    }
    try {
      await patchRepFields(member, am);
      updated++;
      console.log('Updated:', memberEmail, '|', memberCompany, '->', am.name, '(' + source + ')');
    } catch (e) {
      skipped.push({ email: memberEmail, company: memberCompany, reason: 'patch_error: ' + e.message });
    }
  }

  await redisSet(MARKER_KEY, { ranAt: new Date().toISOString(), processed, updated, skippedCount: skipped.length }, 60 * 60 * 24 * 90);

  console.log('---');
  console.log('Processed:', processed);
  console.log('Updated:', updated);
  console.log('Skipped:', skipped.length);
  if (skipped.length) {
    skipped.forEach(s => console.log('  -', s.email, '|', s.company, '|', s.reason));
  }
  console.log('Marker stored at', MARKER_KEY);
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
