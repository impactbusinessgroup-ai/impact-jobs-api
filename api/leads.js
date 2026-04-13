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

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { method, query } = req;

  // GET -- return leads for dashboard (new, pending, in_progress, and reminder leads)
  if (method === 'GET') {
    const keys = await redisKeys('lead:*');
    const leads = [];
    const VISIBLE_STATUSES = ['new', 'pending', 'in_progress'];

    // Load blocked companies for filtering
    const blockedRaw = await redisGet('blocklist:companies');
    const blockedCompanies = (Array.isArray(blockedRaw) ? blockedRaw : []).map(c => c.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\b(inc|llc|corp|co|ltd|group|enterprises|company|solutions|services|technologies|partners)\b/g, '').replace(/\s+/g, ' ').trim());

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

    // --- add_reminder: reset reminder date, keep stage at 3 ---
    if (action === 'add_reminder') {
      lead.last_reminder_date = new Date().toISOString();
      lead.reminder_stage = 3;
      lead.status = 'awaiting_followup';
      await redisSet(id, lead, 60 * 60 * 24 * 14);
      return res.status(200).json({ ok: true, lead });
    }

    // --- Default: generic field update ---
    const updates = body.updates;
    if (!updates) return res.status(400).json({ error: 'Missing updates or action' });
    const updated = { ...lead, ...updates };
    await redisSet(id, updated, 60 * 60 * 24 * 7);

    if (updates.status === 'completed') {
      const domain = lead.company_domain || '';
      if (domain) {
        const completedDomains = (await redisGet('completed_domains')) || [];
        if (!completedDomains.includes(domain)) { completedDomains.push(domain); await redisSet('completed_domains', completedDomains); }
      }
    }

    return res.status(200).json({ ok: true, lead: updated });
  }

  // POST -- log contact feedback
  if (method === 'POST') {
    const { action, title, category, signal } = req.body;
    if (action === 'log_feedback' && title && category && signal) {
      const entry = { title, category, signal, date: new Date().toISOString().split('T')[0] };
      const feedback = (await redisGet('contact_feedback')) || [];
      feedback.push(entry);
      await redisSet('contact_feedback', feedback);
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Invalid feedback payload' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
