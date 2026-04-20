// api/blocklist.js
// Manages dynamic company and title blocklists stored in Redis

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

async function redisSet(key, value) {
  const url = `${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}`;
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value: JSON.stringify(value) }),
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { method } = req;

  // GET -- return current blocklists
  if (method === 'GET') {
    const companies = await redisGet('blocklist:companies') || [];
    const titles = await redisGet('blocklist:titles') || [];
    return res.status(200).json({ ok: true, companies, titles });
  }

  // POST -- add to blocklist (value = string; optional reason stored as object entry)
  if (method === 'POST') {
    const { type, value, reason } = req.body;
    if (!type || !value) return res.status(400).json({ error: 'Missing type or value' });
    if (!['companies', 'titles'].includes(type)) return res.status(400).json({ error: 'Invalid type' });

    const key = `blocklist:${type}`;
    const list = await redisGet(key) || [];

    const entryName = e => (typeof e === 'string' ? e : (e && e.company) || '').toLowerCase();
    const valueLower = String(value).toLowerCase();
    const already = list.some(e => entryName(e) === valueLower);

    if (!already) {
      const entry = reason
        ? { company: value, reason: String(reason), at: new Date().toISOString() }
        : value;
      list.push(entry);
      await redisSet(key, list);
    } else if (reason) {
      // Attach reason to an existing plain-string entry, or update it on an object entry
      const updated = list.map(e => {
        if (entryName(e) !== valueLower) return e;
        const existingName = typeof e === 'string' ? e : (e.company || value);
        return { company: existingName, reason: String(reason), at: new Date().toISOString() };
      });
      await redisSet(key, updated);
      return res.status(200).json({ ok: true, type, value, list: updated });
    }

    return res.status(200).json({ ok: true, type, value, list });
  }

  // DELETE -- remove from blocklist (matches string or object entries by company name)
  if (method === 'DELETE') {
    const { type, value } = req.body;
    if (!type || !value) return res.status(400).json({ error: 'Missing type or value' });

    const key = `blocklist:${type}`;
    const list = await redisGet(key) || [];
    const entryName = e => (typeof e === 'string' ? e : (e && e.company) || '').toLowerCase();
    const valueLower = String(value).toLowerCase();
    const updated = list.filter(e => entryName(e) !== valueLower);
    await redisSet(key, updated);

    return res.status(200).json({ ok: true, type, value, list: updated });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
