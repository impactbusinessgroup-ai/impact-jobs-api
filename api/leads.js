// api/leads.js
// Returns today's qualified leads from Redis for the AM review dashboard

async function redisGet(key) {
  const url = `${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  const data = await res.json();
  if (!data.result) return null;
  try {
    let value = data.result;
    while (typeof value === 'string') value = JSON.parse(value);
    if (value && typeof value.value === 'string') value = JSON.parse(value.value);
    return value;
  } catch (e) {
    return null;
  }
}

async function redisSet(key, value, exSeconds) {
  const url = `${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}`;
  const body = { value: JSON.stringify(value) };
  if (exSeconds) body.ex = exSeconds;
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function redisKeys(pattern) {
  const url = `${process.env.KV_REST_API_URL}/keys/${encodeURIComponent(pattern)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  const data = await res.json();
  return data.result || [];
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function getRootDomain(domain) {
  if (!domain) return domain;
  var d = domain.replace(/^www\./, '');
  var parts = d.split('.');
  if (parts.length <= 2) return d;
  return parts.slice(-2).join('.');
}

function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());
}

function ensureUrl(val) {
  if (!val) return '';
  if (val.indexOf('http') === 0) return val;
  return 'https://' + val;
}

async function callGemini(prompt, maxTokens) {
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + process.env.GOOGLE_API_KEY,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens || 400, temperature: 0.2 }
      })
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.candidates && data.candidates[0] && data.candidates[0].content &&
               data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
               data.candidates[0].content.parts[0].text;
  return text ? text.trim() : null;
}

function parseGeminiJson(text) {
  if (!text) return null;
  const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(clean); } catch (e) { return null; }
}

// Canonical AM name -> email lookup. Used to keep assignedAM / assignedAMEmail
// in sync when a reassign PATCH only sends the display name.
const AM_EMAIL_MAP = {
  'mark sapoznikov': 'msapoznikov@impactbusinessgroup.com',
  'doug koetsier': 'dkoetsier@impactbusinessgroup.com',
  'paul kujawski': 'pkujawski@impactbusinessgroup.com',
  'drew kunkel': 'dkunkel@impactbusinessgroup.com',
  'matt peal': 'mpeal@impactbusinessgroup.com',
  'lauren sylvester': 'lsylvester@impactbusinessgroup.com',
  'dan teliczan': 'dteliczan@impactbusinessgroup.com',
  'curt willbrandt': 'cwillbrandt@impactbusinessgroup.com',
  'trish wangler': 'twangler@impactbusinessgroup.com',
  'mark herman': 'mherman@impactbusinessgroup.com',
  'jamie drajka': 'jdrajka@impactbusinessgroup.com',
  'drew bentsen': 'dbentsen@impactbusinessgroup.com',
  'steve betteley': 'sbetteley@impactbusinessgroup.com'
};
function amEmailForName(name) {
  if (!name) return '';
  return AM_EMAIL_MAP[String(name).trim().toLowerCase()] || '';
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Defensive body parsing: Vercel auto-parses application/json, but a stringified
  // body (or an unexpected Content-Type) would otherwise make req.body a string and
  // cause every PATCH action to look like it's missing fields.
  if (req.body && typeof req.body === 'string') {
    try { req.body = JSON.parse(req.body); } catch (e) { req.body = {}; }
  }
  if (!req.body) req.body = {};

  const { method, query } = req;

  // GET -- validate an AM token and return {email, role, name}
  if (method === 'GET' && query.action === 'validate_token') {
    const t = String(query.token || '').trim();
    if (!t) return res.status(400).json({ ok: false, error: 'missing_token' });
    if (!/^[A-Za-z0-9]{16,64}$/.test(t)) return res.status(400).json({ ok: false, error: 'invalid_token_format' });
    const rec = await redisGet('token:' + t);
    if (!rec || !rec.email) return res.status(401).json({ ok: false, error: 'invalid_token' });
    return res.status(200).json({ ok: true, email: rec.email, role: rec.role || 'am', name: rec.name || '' });
  }

  // GET -- single lead by id for polling
  if (method === 'GET' && query.id) {
    const lead = await redisGet(query.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    return res.status(200).json({ ok: true, lead });
  }

  // GET -- skipped + blocked archive for the current AM within a time window
  if (method === 'GET' && query.view === 'archive') {
    const amEmail = String(query.am || '').toLowerCase();
    const days = Math.max(1, parseInt(query.days, 10) || 1);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const keys = await redisKeys('lead:*');
    const blockedRaw = await redisGet('blocklist:companies');
    const blockedCompanies = (Array.isArray(blockedRaw) ? blockedRaw : [])
      .map(e => typeof e === 'string' ? e : (e && e.company) || '')
      .filter(Boolean)
      .map(c => c.toLowerCase().trim());

    const skipped = [];
    const blocked = [];
    for (const key of keys) {
      try {
        const lead = await redisGet(key);
        if (!lead || !lead.company) continue;
        if (amEmail && (lead.assignedAMEmail || '').toLowerCase() !== amEmail) continue;

        const createdMs = typeof lead.createdAt === 'number'
          ? lead.createdAt
          : (lead.createdAt ? Date.parse(lead.createdAt) : 0);
        const skippedMs = lead.skippedAt ? Date.parse(lead.skippedAt) : createdMs;
        const companyLower = lead.company.toLowerCase();
        const isBlocked = blockedCompanies.some(bc =>
          companyLower === bc || companyLower.includes(bc) || bc.includes(companyLower)
        );

        if (lead.status === 'skipped' && skippedMs >= cutoff) {
          skipped.push({ ...lead, _dateMs: skippedMs });
        } else if (isBlocked && createdMs >= cutoff) {
          blocked.push({ ...lead, _dateMs: createdMs });
        }
      } catch (e) {
        console.error('Archive read error for', key, e.message);
      }
    }

    skipped.sort((a, b) => b._dateMs - a._dateMs);
    blocked.sort((a, b) => b._dateMs - a._dateMs);

    return res.status(200).json({ ok: true, skipped, blocked });
  }

  // GET -- return leads for dashboard (new, pending, in_progress, and reminder leads)
  if (method === 'GET') {
    const keys = await redisKeys('lead:*');
    const leads = [];
    const VISIBLE_STATUSES = ['new', 'pending', 'in_progress'];

    // Load blocked companies for filtering (entries may be strings or {company,reason,at})
    const blockedRaw = await redisGet('blocklist:companies');
    const blockedCompanies = (Array.isArray(blockedRaw) ? blockedRaw : [])
      .map(e => typeof e === 'string' ? e : (e && e.company) || '')
      .filter(Boolean)
      .map(c => c.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\b(inc|llc|corp|co|ltd|group|enterprises|company|solutions|services|technologies|partners)\b/g, '').replace(/\s+/g, ' ').trim());

    for (const key of keys) {
      try {
        const lead = await redisGet(key);
        if (!lead || !lead.company) continue;
        if (!VISIBLE_STATUSES.includes(lead.status)) continue;
        const norm = (lead.normalizedCompany || lead.company.toLowerCase()).replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        const isBlocked = blockedCompanies.some(bc => norm.includes(bc) || bc.includes(norm));
        if (!isBlocked) leads.push(lead);
      } catch(e) {
        console.error('Error reading lead key:', key, e.message);
      }
    }

    // Exclude leads with no contacts
    const ready = leads.filter(lead => lead.contacts && lead.contacts.length > 0);

    // Sort by createdAt descending
    ready.sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({ ok: true, leads: ready });
  }

  // PATCH -- update a lead
  if (method === 'PATCH') {
    const body = req.body;
    const id = body.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const lead = await redisGet(id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const action = body.action;

    // --- log_outreach: log outreach methods to a contact ---
    if (action === 'log_outreach') {
      const { apollo_id, contact_name, contact_title, methods, am_email } = body;
      if (!apollo_id || !methods || !methods.length) return res.status(400).json({ error: 'Missing apollo_id or methods' });
      if (!lead.outreach_log) lead.outreach_log = {};
      const prev = lead.outreach_log[apollo_id] || [];
      const attempt = prev.length + 1;
      const entry = { methods, attempt, date: new Date().toISOString(), am_email: am_email || '' };
      prev.push(entry);
      lead.outreach_log[apollo_id] = prev;
      if (lead.status === 'new') lead.status = 'in_progress';
      await redisSet(id, lead, 60 * 60 * 24 * 14);
      // Write to activity log
      const log = (await redisGet('contact_activity_log')) || [];
      log.push({ apollo_id, contact_name: contact_name || '', contact_title: contact_title || '', lead_category: lead.category || '', action_type: 'outreach_sent', outreach_methods: methods, attempt, reminder_stage: lead.reminder_stage || 0, am_email: am_email || '', lead_id: id, date: new Date().toISOString() });
      await redisSet('contact_activity_log', log);
      return res.status(200).json({ ok: true, attempt, lead });
    }

    // --- log_removal: remove contact and log reason ---
    if (action === 'log_removal') {
      const { apollo_id, contact_name, contact_title, reason, am_email } = body;
      if (!apollo_id || !reason) return res.status(400).json({ error: 'Missing apollo_id or reason' });
      if (lead.contacts) lead.contacts = lead.contacts.filter(c => (c.apollo_id || '') !== apollo_id);
      await redisSet(id, lead, 60 * 60 * 24 * 14);
      const logEntry = { apollo_id, contact_name: contact_name || '', contact_title: contact_title || '', lead_category: lead.category || '', action_type: 'removal', removal_reason: reason, reminder_stage: lead.reminder_stage || 0, am_email: am_email || '', lead_id: id, date: new Date().toISOString() };
      if (reason === 'made_contact') logEntry.outreach_result = 'made_contact';
      const log = (await redisGet('contact_activity_log')) || [];
      log.push(logEntry);
      await redisSet('contact_activity_log', log);
      return res.status(200).json({ ok: true, lead });
    }

    // --- complete_lead: set to awaiting_followup ---
    if (action === 'complete_lead') {
      const { am_email } = body;
      lead.status = 'awaiting_followup';
      lead.completedAt = new Date().toISOString();
      lead.reminder_stage = 0;
      lead.last_reminder_date = lead.completedAt;
      // Build outreach summary from log
      const summary = [];
      if (lead.outreach_log) {
        for (const aid in lead.outreach_log) {
          const entries = lead.outreach_log[aid];
          const contact = (lead.contacts || []).find(c => c.apollo_id === aid);
          summary.push({ apollo_id: aid, name: contact ? (contact.full_name || contact.name || '') : aid, attempts: entries });
        }
      }
      lead.outreach_summary = summary;
      const domain = lead.company_domain || '';
      if (domain) {
        const completedDomains = (await redisGet('completed_domains')) || [];
        if (!completedDomains.includes(domain)) { completedDomains.push(domain); await redisSet('completed_domains', completedDomains); }
      }
      await redisSet(id, lead, 60 * 60 * 24 * 14);
      return res.status(200).json({ ok: true, lead });
    }

    // --- close_out: permanently close lead ---
    if (action === 'close_out') {
      lead.status = 'closed';
      lead.closedAt = new Date().toISOString();
      await redisSet(id, lead, 60 * 60 * 24 * 14);
      return res.status(200).json({ ok: true, lead });
    }

    // --- retrieve: move skipped lead back to pending ---
    if (action === 'retrieve') {
      lead.status = 'pending';
      lead.retrievedAt = new Date().toISOString();
      await redisSet(id, lead, 60 * 60 * 24 * 14);
      return res.status(200).json({ ok: true, lead });
    }

    // --- unblock: remove company from blocklist and restore lead to pending ---
    if (action === 'unblock') {
      const company = (lead.company || '').toLowerCase();
      const blocked = (await redisGet('blocklist:companies')) || [];
      const filtered = (Array.isArray(blocked) ? blocked : []).filter(e => {
        const name = typeof e === 'string' ? e : (e && e.company) || '';
        return name.toLowerCase() !== company;
      });
      await redisSet('blocklist:companies', filtered);
      lead.status = 'pending';
      lead.unblockedAt = new Date().toISOString();
      await redisSet(id, lead, 60 * 60 * 24 * 14);
      return res.status(200).json({ ok: true, lead, blocklist: filtered });
    }

    // --- add_reminder: reset reminder date, keep stage at 3 ---
    if (action === 'add_reminder') {
      lead.last_reminder_date = new Date().toISOString();
      lead.reminder_stage = 3;
      lead.status = 'awaiting_followup';
      await redisSet(id, lead, 60 * 60 * 24 * 14);
      return res.status(200).json({ ok: true, lead });
    }

    // --- update_category: change lead category ---
    if (action === 'update_category') {
      const validCats = ['engineering', 'it', 'accounting', 'other'];
      const newCat = (body.category || '').toLowerCase();
      if (!validCats.includes(newCat)) return res.status(400).json({ error: 'Invalid category' });
      lead.category = newCat;
      await redisSet(id, lead, 60 * 60 * 24 * 14);
      return res.status(200).json({ ok: true, lead });
    }

    // --- update_domain: change company domain and optionally re-enrich ---
    if (action === 'update_domain') {
      let rawInput = (body.domain || '').trim();
      if (!rawInput) return res.status(400).json({ error: 'Missing domain' });
      if (!/^https?:\/\//i.test(rawInput)) rawInput = 'https://' + rawInput;
      const newDomain = rawInput.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '').trim().toLowerCase();
      if (!newDomain) return res.status(400).json({ error: 'Invalid domain' });
      lead.company_domain = newDomain;
      lead.company_website = 'https://' + newDomain;
      // Clear cached org data so re-enrichment uses new domain
      delete lead.apollo_org_id;
      delete lead.apollo_num_locations;
      delete lead.apollo_hq_city;
      delete lead.apollo_hq_state;
      delete lead.apollo_estimated_employees;
      delete lead.company_linkedin;
      // Update logo
      if (process.env.BRANDFETCH_CLIENT_ID) {
        lead.company_logo = 'https://cdn.brandfetch.io/' + encodeURIComponent(newDomain) + '/w/128/h/128?c=' + process.env.BRANDFETCH_CLIENT_ID;
      }
      await redisSet(id, lead, 60 * 60 * 24 * 14);

      if (!body.reenrich) {
        return res.status(200).json({ ok: true, lead });
      }

      // Re-enrichment pipeline (same as add_lead flow)
      const enrichStart = Date.now();
      async function reEnrich() {
        let orgId = null;
        let org = {};
        const orgRes = await fetch('https://api.apollo.io/api/v1/organizations/enrich?domain=' + encodeURIComponent(newDomain), {
          headers: { 'x-api-key': process.env.APOLLO_API_KEY }
        });
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          org = orgData.organization || {};
          orgId = org.id;
        }
        if (!orgId) {
          const locState = (lead.location || '').split(',')[1] ? (lead.location || '').split(',')[1].trim() : '';
          const searchBody = { q_organization_name: lead.company, per_page: 5 };
          if (locState) searchBody.organization_locations = [locState];
          const nsRes = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
            method: 'POST',
            headers: { 'x-api-key': process.env.APOLLO_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify(searchBody)
          });
          if (nsRes.ok) {
            const nsData = await nsRes.json();
            const orgs = nsData.organizations || nsData.accounts || [];
            if (orgs.length > 0) { orgId = orgs[0].id; org = orgs[0]; }
          }
          if (!orgId && locState) {
            const nsRes2 = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
              method: 'POST',
              headers: { 'x-api-key': process.env.APOLLO_API_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({ q_organization_name: lead.company, per_page: 5 })
            });
            if (nsRes2.ok) {
              const nsData2 = await nsRes2.json();
              const orgs2 = nsData2.organizations || nsData2.accounts || [];
              if (orgs2.length > 0) { orgId = orgs2[0].id; org = orgs2[0]; }
            }
          }
        }
        if (!orgId) { lead.contactsEnrichedAt = Date.now(); return; }
        lead.apollo_org_id = orgId;
        lead.apollo_hq_city = org.city || '';
        lead.apollo_hq_state = org.state || '';
        if (org.linkedin_url) lead.company_linkedin = org.linkedin_url;

        const jobTitle = lead.jobTitle || '';
        const description = lead.description || '';
        const company = lead.company || '';
        const titlesPrompt = 'Generate 8-12 search keywords representing titles of hiring decision makers for this role. Think broadly.\n\nJob title: ' + jobTitle + '\nCompany: ' + company + '\nDescription: ' + description.substring(0, 1500) + '\n\nReturn only a JSON array of title keyword phrases.';
        const titlesText = await callGemini(titlesPrompt, 1000);
        let personTitles = parseGeminiJson(titlesText);
        if (!Array.isArray(personTitles) || !personTitles.length) {
          personTitles = ['Director', 'VP', 'Manager', 'President', 'General Manager'];
        }
        const searchBody2 = { organization_ids: [orgId], person_titles: personTitles, per_page: 10 };
        const apolloRes = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
          method: 'POST',
          headers: { 'x-api-key': process.env.APOLLO_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(searchBody2)
        });
        let people = [];
        if (apolloRes.ok) { const d = await apolloRes.json(); people = d.people || []; }
        if (!people.length) {
          const broadBody = { organization_ids: [orgId], person_titles: ['President','CEO','Owner','COO','Operations Manager','General Manager','Plant Manager','HR Manager','Director','VP','Vice President','Manager'], per_page: 10 };
          const broadRes = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
            method: 'POST',
            headers: { 'x-api-key': process.env.APOLLO_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify(broadBody)
          });
          if (broadRes.ok) { const bd = await broadRes.json(); people = bd.people || []; }
        }
        if (!people.length) { lead.contactsEnrichedAt = Date.now(); return; }
        const contactList = people.map((p, i) => i + '. ' + (p.first_name || '') + ' ' + (p.last_name || '') + ' - ' + (p.title || 'Unknown')).join('\n');
        const valPrompt = 'Given this job posting for ' + jobTitle + ' at ' + company + ', which contacts are most likely hiring decision makers? Return a JSON array of indexes (max 3), or [] if none.\n\nDescription:\n' + description.substring(0, 1500) + '\n\nContacts:\n' + contactList;
        const rankText = await callGemini(valPrompt);
        let selectedIndexes = parseGeminiJson(rankText);
        if (!Array.isArray(selectedIndexes) || !selectedIndexes.length) {
          const senOrder = ['president','ceo','vp','vice president','director','senior manager','manager'];
          const ranked = people.map((p, i) => {
            const t = (p.title || '').toLowerCase();
            let rank = senOrder.length;
            for (let s = 0; s < senOrder.length; s++) { if (t.includes(senOrder[s])) { rank = s; break; } }
            return { idx: i, rank };
          }).sort((a, b) => a.rank - b.rank);
          selectedIndexes = ranked.slice(0, 3).map(r => r.idx);
        }
        const contacts = [];
        for (let j = 0; j < selectedIndexes.length && contacts.length < 3; j++) {
          const idx = selectedIndexes[j];
          if (idx < 0 || idx >= people.length) continue;
          const person = people[idx];
          try {
            const matchRes = await fetch('https://api.apollo.io/api/v1/people/match', {
              method: 'POST',
              headers: { 'x-api-key': process.env.APOLLO_API_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: person.id })
            });
            if (!matchRes.ok) continue;
            const matchData = await matchRes.json();
            const enriched = matchData.person || matchData;
            const country = enriched.country || '';
            if (country && country !== 'United States') continue;
            contacts.push({
              apollo_id: enriched.id || person.id || '',
              first_name: enriched.first_name || '',
              last_name: enriched.last_name || '',
              full_name: ((enriched.first_name || '') + ' ' + (enriched.last_name || '')).trim(),
              name: ((enriched.first_name || '') + ' ' + (enriched.last_name || '')).trim(),
              job_title: enriched.title || '',
              title: enriched.title || '',
              city: toTitleCase(enriched.city || ''),
              state: toTitleCase(enriched.state || ''),
              country: enriched.country || '',
              linkedin: ensureUrl(enriched.linkedin_url || ''),
              photo_url: enriched.photo_url || '',
              email: null,
              source: 'apollo'
            });
          } catch (e) { console.log('Re-enrich error:', e.message); }
        }
        const apolloIds = {};
        contacts.forEach(c => { if (c.apollo_id) apolloIds[c.apollo_id] = true; });
        const allContacts = [];
        people.forEach(p => {
          if (p.id && !apolloIds[p.id]) {
            allContacts.push({
              apollo_id: p.id, first_name: p.first_name || '',
              last_name_obfuscated: (p.last_name || '').charAt(0) + '.',
              title: p.title || '', photo_url: p.photo_url || '',
              linkedin_url: p.linkedin_url || '', has_city: !!p.city, has_state: !!p.state
            });
          }
        });
        lead.contacts = contacts;
        lead.allContacts = allContacts;
        lead.contactsEnrichedAt = Date.now();
        console.log('Re-enrichment complete:', lead.company, '| contacts:', contacts.length, '| elapsed:', (Date.now() - enrichStart) + 'ms');
      }
      try {
        await Promise.race([
          reEnrich(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('reenrich_timeout')), 25000))
        ]);
      } catch (e) {
        console.log('Re-enrichment timeout/error:', e.message);
        lead.contactsEnrichedAt = Date.now();
      }
      await redisSet(id, lead, 60 * 60 * 24 * 14);
      return res.status(200).json({ ok: true, lead });
    }

    // --- Default: generic field update ---
    const updates = body.updates;
    if (!updates) return res.status(400).json({ error: 'Missing updates or action', received: { hasAction: !!action, action: action || null, bodyKeys: Object.keys(body || {}) } });

    // Reassignment: when the client sends only assignedAM (name), look up the
    // canonical email so both fields stay in sync. Filter is keyed on email.
    if (updates.assignedAM && !updates.assignedAMEmail) {
      const mappedEmail = amEmailForName(updates.assignedAM);
      if (mappedEmail) updates.assignedAMEmail = mappedEmail;
    }
    // If assignedAMEmail is provided without a name, attempt the reverse lookup.
    if (updates.assignedAMEmail && !updates.assignedAM) {
      const byEmail = Object.keys(AM_EMAIL_MAP).find(n => AM_EMAIL_MAP[n] === String(updates.assignedAMEmail).trim().toLowerCase());
      if (byEmail) updates.assignedAM = byEmail.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // Detect reassignment (assignedAMEmail changed) BEFORE applying updates
    const isReassign = !!updates.assignedAMEmail &&
      (String(updates.assignedAMEmail).toLowerCase() !== String(lead.assignedAMEmail || '').toLowerCase());

    const updated = { ...lead, ...updates };
    await redisSet(id, updated, 60 * 60 * 24 * 14);

    if (isReassign) {
      try {
        const log = (await redisGet('contact_activity_log')) || [];
        log.push({
          action_type: 'reassigned',
          from_am: lead.assignedAMEmail || '',
          from_am_name: lead.assignedAM || '',
          to_am: updated.assignedAMEmail || '',
          to_am_name: updated.assignedAM || '',
          reason: body.reassign_reason || 'manual',
          lead_id: id,
          company: lead.company || '',
          job_title: lead.jobTitle || '',
          category: lead.category || '',
          date: new Date().toISOString(),
        });
        await redisSet('contact_activity_log', log);
      } catch (e) { console.error('reassign log error:', e.message); }
    }

    if (updates.status === 'completed') {
      const domain = lead.company_domain || '';
      if (domain) {
        const completedDomains = (await redisGet('completed_domains')) || [];
        if (!completedDomains.includes(domain)) { completedDomains.push(domain); await redisSet('completed_domains', completedDomains); }
      }
    }

    return res.status(200).json({ ok: true, lead: updated });
  }

  // POST -- log contact feedback or add a manual lead
  if (method === 'POST') {
    const body = req.body || {};
    const action = body.action;

    if (action === 'log_feedback') {
      const { title, category, signal } = body;
      if (title && category && signal) {
        const entry = { title, category, signal, date: new Date().toISOString().split('T')[0] };
        const feedback = (await redisGet('contact_feedback')) || [];
        feedback.push(entry);
        await redisSet('contact_feedback', feedback);
        return res.status(200).json({ ok: true });
      }
      return res.status(400).json({ error: 'Invalid feedback payload' });
    }

    if (action === 'extract_job') {
      const { description } = body;
      if (!description) return res.status(400).json({ error: 'Missing description' });
      const prompt = 'Extract the following from this job posting and return as JSON: {"jobTitle": "...", "company": "...", "city": "...", "state": "...", "category": "engineering|it|accounting|other", "domain": "company.com"}\n\nCategory rules:\n- engineering: mechanical, electrical, civil, manufacturing, process, quality, design, product, chemical, environmental, controls, structural engineers and engineering managers\n- it: software, data, cloud, cybersecurity, network, systems, DevOps, QA/testing, IT support, database, AI/ML engineers and IT managers\n- accounting: accountants, auditors, financial analysts, controllers, bookkeepers, tax, payroll, billing\n- other: anything else\n\nFor domain, infer the company website from context clues. Return only JSON.\n\nJob Description:\n' + description.substring(0, 3000);
      try {
        const text = await callGemini(prompt, 500);
        const parsed = parseGeminiJson(text);
        if (parsed) {
          const loc = (parsed.city && parsed.state) ? parsed.city + ', ' + parsed.state : (parsed.city || parsed.state || '');
          return res.status(200).json({ ok: true, jobTitle: parsed.jobTitle || '', company: parsed.company || '', location: loc, category: parsed.category || 'engineering', domain: parsed.domain || '' });
        }
      } catch (e) { console.log('Extract error:', e.message); }
      return res.status(200).json({ ok: false, error: 'Could not parse job description' });
    }

    if (action === 'contact_search') {
      const { org_id, person_titles, q_keywords, person_departments, person_seniorities, person_locations, per_page } = body;
      if (!org_id) return res.status(400).json({ error: 'Missing org_id' });
      const searchBody = { organization_ids: [org_id], per_page: per_page || 10 };
      if (person_titles && person_titles.length) searchBody.person_titles = person_titles;
      if (q_keywords) searchBody.q_keywords = q_keywords;
      if (person_departments && person_departments.length) searchBody.person_departments = person_departments;
      if (person_seniorities && person_seniorities.length) searchBody.person_seniorities = person_seniorities;
      if (person_locations && person_locations.length) searchBody.person_locations = person_locations;
      try {
        const res2 = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
          method: 'POST',
          headers: { 'x-api-key': process.env.APOLLO_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(searchBody)
        });
        if (!res2.ok) return res.status(502).json({ error: 'Apollo search failed' });
        const data = await res2.json();
        const people = (data.people || []).map(p => ({
          apollo_id: p.id || '',
          first_name: p.first_name || '',
          last_name_initial: ((p.last_name || '').charAt(0) || '') + '.',
          title: p.title || '',
          city: p.city || '',
          state: p.state || '',
          linkedin_url: p.linkedin_url || '',
          photo_url: p.photo_url || ''
        }));
        return res.status(200).json({ ok: true, people });
      } catch (e) {
        return res.status(500).json({ error: 'Search error: ' + e.message });
      }
    }

    if (action === 'add_lead') {
      const { jobTitle, company, location, category, jobUrl, description } = body;
      if (!jobTitle || !company || !location) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Use domain from frontend (already extracted by extract_job) or infer
      let domain = (body.domain || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').trim().toLowerCase();
      if (!domain) {
        const domainPrompt = 'Given this company name and job description, return only the company\'s primary website domain (e.g. "acme.com"). No explanation, just the domain.\n\nCompany: ' + company + '\nJob Description: ' + (description || '').substring(0, 500);
        try {
          const domainText = await callGemini(domainPrompt, 50);
          if (domainText) domain = domainText.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').trim().toLowerCase();
        } catch (e) { console.log('Domain extraction error:', e.message); }
      }
      if (domain) domain = getRootDomain(domain);

      // Step 2: Create lead object
      const today = new Date().toISOString().split('T')[0];
      const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 40);
      const leadId = 'lead:' + today + ':' + slug;
      const cat = (category || 'engineering').toLowerCase();
      const amEmail = body.amEmail || 'msapoznikov@impactbusinessgroup.com';

      const lead = {
        id: leadId,
        jobTitle: jobTitle,
        company: company,
        location: location,
        category: cat,
        status: 'pending',
        company_domain: domain,
        description: description,
        jobUrl: jobUrl || '',
        createdAt: Date.now(),
        assignedAMEmail: amEmail,
        assignedAM: 'Mark Sapoznikov',
        source: 'manual',
        contacts: [],
        allContacts: []
      };

      // Fetch company logo via Brandfetch
      if (domain && process.env.BRANDFETCH_CLIENT_ID) {
        lead.company_logo = 'https://cdn.brandfetch.io/' + encodeURIComponent(domain) + '/w/128/h/128?c=' + process.env.BRANDFETCH_CLIENT_ID;
      }

      // Save immediately so polling can find it
      await redisSet(leadId, lead, 604800);
      console.log('Manual lead created:', company, '| domain:', domain, '| id:', leadId);

      // Run enrichment pipeline with 25s hard timeout, then respond
      const enrichStart = Date.now();
      const enrichTimeout = 25000;

      async function runEnrichment() {
        let orgId = null;
        let org = {};
        if (domain) {
          const orgRes = await fetch('https://api.apollo.io/api/v1/organizations/enrich?domain=' + encodeURIComponent(domain), {
            headers: { 'x-api-key': process.env.APOLLO_API_KEY }
          });
          if (orgRes.ok) {
            const orgData = await orgRes.json();
            org = orgData.organization || {};
            orgId = org.id;
          }
        }

        if (!orgId) {
          // Try with location filter first
          const locState = (location || '').split(',')[1] ? (location || '').split(',')[1].trim() : '';
          const searchBody = { q_organization_name: company, per_page: 5 };
          if (locState) searchBody.organization_locations = [locState];
          console.log('[add_lead] Org name search request:', JSON.stringify(searchBody));
          const nsRes = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
            method: 'POST',
            headers: { 'x-api-key': process.env.APOLLO_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify(searchBody)
          });
          if (nsRes.ok) {
            const nsData = await nsRes.json();
            const orgs = nsData.organizations || nsData.accounts || [];
            console.log('[add_lead] Org name search results:', orgs.slice(0, 3).map(o => ({ name: o.name, state: o.state, id: o.id })));
            if (orgs.length > 0) { orgId = orgs[0].id; org = orgs[0]; }
          }
          // Fallback: retry without location filter
          if (!orgId && locState) {
            const fallbackBody = { q_organization_name: company, per_page: 5 };
            console.log('[add_lead] Org name search retry (no location):', JSON.stringify(fallbackBody));
            const nsRes2 = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
              method: 'POST',
              headers: { 'x-api-key': process.env.APOLLO_API_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify(fallbackBody)
            });
            if (nsRes2.ok) {
              const nsData2 = await nsRes2.json();
              const orgs2 = nsData2.organizations || nsData2.accounts || [];
              console.log('[add_lead] Retry results:', orgs2.slice(0, 3).map(o => ({ name: o.name, state: o.state, id: o.id })));
              if (orgs2.length > 0) { orgId = orgs2[0].id; org = orgs2[0]; }
            }
          }
        }

        if (!orgId) { lead.contactsEnrichedAt = Date.now(); return; }

        lead.apollo_org_id = orgId;
        lead.apollo_hq_city = org.city || '';
        lead.apollo_hq_state = org.state || '';
        if (org.linkedin_url) lead.company_linkedin = org.linkedin_url;

        const titlesPrompt = 'Generate 8-12 search keywords representing titles of hiring decision makers for this role. Think broadly.\n\nJob title: ' + jobTitle + '\nCompany: ' + company + '\nDescription: ' + (description || '').substring(0, 1500) + '\n\nReturn only a JSON array of title keyword phrases.';
        const titlesText = await callGemini(titlesPrompt, 1000);
        let personTitles = parseGeminiJson(titlesText);
        if (!Array.isArray(personTitles) || !personTitles.length) {
          personTitles = ['Director', 'VP', 'Manager', 'President', 'General Manager'];
        }

        const searchBody = { organization_ids: [orgId], person_titles: personTitles, per_page: 10 };
        const apolloRes = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
          method: 'POST',
          headers: { 'x-api-key': process.env.APOLLO_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(searchBody)
        });

        let people = [];
        if (apolloRes.ok) {
          const apolloData = await apolloRes.json();
          people = apolloData.people || [];
        }

        if (!people.length) {
          const broadBody = { organization_ids: [orgId], person_titles: ['President','CEO','Owner','COO','Operations Manager','General Manager','Plant Manager','HR Manager','Director','VP','Vice President','Manager'], per_page: 10 };
          const broadRes = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
            method: 'POST',
            headers: { 'x-api-key': process.env.APOLLO_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify(broadBody)
          });
          if (broadRes.ok) {
            const broadData = await broadRes.json();
            people = broadData.people || [];
          }
        }

        if (!people.length) { lead.contactsEnrichedAt = Date.now(); return; }

        const contactList = people.map((p, i) => i + '. ' + (p.first_name || '') + ' ' + (p.last_name || '') + ' - ' + (p.title || 'Unknown')).join('\n');
        const valPrompt = 'Given this job posting for ' + jobTitle + ' at ' + company + ', which contacts are most likely hiring decision makers? Return a JSON array of indexes (max 3), or [] if none.\n\nDescription:\n' + (description || '').substring(0, 1500) + '\n\nContacts:\n' + contactList;
        const rankText = await callGemini(valPrompt);
        let selectedIndexes = parseGeminiJson(rankText);
        if (!Array.isArray(selectedIndexes) || !selectedIndexes.length) {
          const senOrder = ['president','ceo','vp','vice president','director','senior manager','manager'];
          const ranked = people.map((p, i) => {
            const t = (p.title || '').toLowerCase();
            let rank = senOrder.length;
            for (let s = 0; s < senOrder.length; s++) { if (t.includes(senOrder[s])) { rank = s; break; } }
            return { idx: i, rank };
          }).sort((a, b) => a.rank - b.rank);
          selectedIndexes = ranked.slice(0, 3).map(r => r.idx);
        }

        const contacts = [];
        for (let j = 0; j < selectedIndexes.length && contacts.length < 3; j++) {
          const idx = selectedIndexes[j];
          if (idx < 0 || idx >= people.length) continue;
          const person = people[idx];
          try {
            const matchRes = await fetch('https://api.apollo.io/api/v1/people/match', {
              method: 'POST',
              headers: { 'x-api-key': process.env.APOLLO_API_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: person.id })
            });
            if (!matchRes.ok) continue;
            const matchData = await matchRes.json();
            const enriched = matchData.person || matchData;
            const country = enriched.country || '';
            if (country && country !== 'United States') continue;
            contacts.push({
              apollo_id: enriched.id || person.id || '',
              first_name: enriched.first_name || '',
              last_name: enriched.last_name || '',
              full_name: ((enriched.first_name || '') + ' ' + (enriched.last_name || '')).trim(),
              name: ((enriched.first_name || '') + ' ' + (enriched.last_name || '')).trim(),
              job_title: enriched.title || '',
              title: enriched.title || '',
              city: toTitleCase(enriched.city || ''),
              state: toTitleCase(enriched.state || ''),
              country: enriched.country || '',
              linkedin: ensureUrl(enriched.linkedin_url || ''),
              photo_url: enriched.photo_url || '',
              email: null,
              source: 'apollo'
            });
          } catch (e) { console.log('Enrich error:', e.message); }
        }

        const apolloIds = {};
        contacts.forEach(c => { if (c.apollo_id) apolloIds[c.apollo_id] = true; });
        const allContacts = [];
        people.forEach(p => {
          if (p.id && !apolloIds[p.id]) {
            allContacts.push({
              apollo_id: p.id,
              first_name: p.first_name || '',
              last_name_obfuscated: (p.last_name || '').charAt(0) + '.',
              title: p.title || '',
              photo_url: p.photo_url || '',
              linkedin_url: p.linkedin_url || '',
              has_city: !!p.city,
              has_state: !!p.state
            });
          }
        });

        lead.contacts = contacts;
        lead.allContacts = allContacts;
        lead.contactsEnrichedAt = Date.now();
        console.log('Manual lead enriched:', company, '| contacts:', contacts.length, '| allContacts:', allContacts.length, '| elapsed:', (Date.now() - enrichStart) + 'ms');
      }

      // Race enrichment against 25s timeout
      try {
        await Promise.race([
          runEnrichment(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('enrichment_timeout')), enrichTimeout))
        ]);
      } catch (e) {
        if (e.message === 'enrichment_timeout') {
          console.log('Manual lead enrichment timeout after 25s:', company, '| contacts so far:', (lead.contacts || []).length);
          lead.contactsEnrichedAt = Date.now();
        } else {
          console.error('Manual lead enrichment error:', e.message);
          lead.contactsEnrichedAt = Date.now();
        }
      }

      // Save final state and respond
      await redisSet(leadId, lead, 604800);
      return res.status(200).json({ ok: true, leadId, lead });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
