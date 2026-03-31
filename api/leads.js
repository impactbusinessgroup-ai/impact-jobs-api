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
    const keys = await redisKeys(`lead:*`);
    const leads = [];

    for (const key of keys) {
      const lead = await redisGet(key);
      if (lead && lead.status !== 'skipped') {
        leads.push(lead);
      }
    }

    // Sort by createdAt descending
    leads.sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({ ok: true, date, leads });
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
