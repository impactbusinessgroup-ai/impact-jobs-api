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
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value: JSON.stringify(value), ex: exSeconds }),
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

  // GET -- return today's leads
 if (method === 'GET') {
    const keys = await redisKeys('lead:*');
    const leads = [];

    // Load blocked companies for filtering
    const blockedRaw = await redisGet('blocklist:companies');
    const blockedCompanies = (Array.isArray(blockedRaw) ? blockedRaw : []).map(c => c.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\b(inc|llc|corp|co|ltd|group|enterprises|company|solutions|services|technologies|partners)\b/g, '').replace(/\s+/g, ' ').trim());

    for (const key of keys) {
      try {
        const lead = await redisGet(key);
        if (lead && lead.status !== 'skipped' && lead.company) {
          const norm = (lead.normalizedCompany || lead.company.toLowerCase()).replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
          const isBlocked = blockedCompanies.some(bc => norm.includes(bc) || bc.includes(norm));
          if (!isBlocked) leads.push(lead);
        }
      } catch(e) {
        console.error('Error reading lead key:', key, e.message);
      }
    }

    // Sort by createdAt descending
    leads.sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({ ok: true, leads });
  }

  // PATCH -- update a lead (skip, update status, add contact)
  if (method === 'PATCH') {
    const { id, updates } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const lead = await redisGet(id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const updated = { ...lead, ...updates };
    await redisSet(id, updated, 60 * 60 * 24 * 7);

    return res.status(200).json({ ok: true, lead: updated });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
