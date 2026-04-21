// api/templates.js
// Per-AM email-template storage. Backed by Redis at am_templates:{amEmail}.
// Each template: { id, name, subject, body (HTML), createdAt, updatedAt }.

const _amData = require('./_am_data');

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

function key(amEmail) {
  return 'am_templates:' + String(amEmail).toLowerCase();
}

function isValidAm(amEmail) {
  if (!amEmail) return false;
  return !!_amData.AMS[String(amEmail).toLowerCase()];
}

function genId() {
  return 'tpl_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function sanitizeName(name) {
  return String(name || '').trim().slice(0, 80);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.body && typeof req.body === 'string') {
    try { req.body = JSON.parse(req.body); } catch (e) { req.body = {}; }
  }
  if (!req.body) req.body = {};

  const amEmail = String(
    (req.query && req.query.am) || (req.body && req.body.am) || ''
  ).toLowerCase();
  if (!isValidAm(amEmail)) {
    return res.status(401).json({ ok: false, error: 'invalid_am' });
  }

  const k = key(amEmail);

  // GET — list all templates for this AM
  if (req.method === 'GET') {
    const list = (await redisGet(k)) || [];
    return res.status(200).json({ ok: true, templates: Array.isArray(list) ? list : [] });
  }

  // POST { action: 'create', name, subject, body }
  // POST { action: 'update', id, subject, body }
  // POST { action: 'rename', id, name }
  if (req.method === 'POST') {
    const action = req.body.action;
    const list = (await redisGet(k)) || [];
    const safeList = Array.isArray(list) ? list : [];

    if (action === 'create') {
      const name = sanitizeName(req.body.name);
      if (!name) return res.status(400).json({ ok: false, error: 'missing_name' });
      const tpl = {
        id: genId(),
        name,
        subject: String(req.body.subject || ''),
        body: String(req.body.body || ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      safeList.push(tpl);
      await redisSet(k, safeList);
      return res.status(200).json({ ok: true, template: tpl });
    }

    if (action === 'update') {
      const id = String(req.body.id || '');
      const idx = safeList.findIndex(t => t && t.id === id);
      if (idx < 0) return res.status(404).json({ ok: false, error: 'not_found' });
      safeList[idx].subject = String(req.body.subject || '');
      safeList[idx].body = String(req.body.body || '');
      safeList[idx].updatedAt = new Date().toISOString();
      await redisSet(k, safeList);
      return res.status(200).json({ ok: true, template: safeList[idx] });
    }

    if (action === 'rename') {
      const id = String(req.body.id || '');
      const name = sanitizeName(req.body.name);
      if (!name) return res.status(400).json({ ok: false, error: 'missing_name' });
      const idx = safeList.findIndex(t => t && t.id === id);
      if (idx < 0) return res.status(404).json({ ok: false, error: 'not_found' });
      safeList[idx].name = name;
      safeList[idx].updatedAt = new Date().toISOString();
      await redisSet(k, safeList);
      return res.status(200).json({ ok: true, template: safeList[idx] });
    }

    return res.status(400).json({ ok: false, error: 'invalid_action' });
  }

  // DELETE ?am=...&id=...
  if (req.method === 'DELETE') {
    const id = String((req.query && req.query.id) || (req.body && req.body.id) || '');
    if (!id) return res.status(400).json({ ok: false, error: 'missing_id' });
    const list = (await redisGet(k)) || [];
    const safeList = Array.isArray(list) ? list : [];
    const next = safeList.filter(t => t && t.id !== id);
    if (next.length === safeList.length) return res.status(404).json({ ok: false, error: 'not_found' });
    await redisSet(k, next);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ ok: false, error: 'method_not_allowed' });
};
