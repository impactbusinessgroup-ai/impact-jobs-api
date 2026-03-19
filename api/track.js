// api/track.js
// Receives page visit pings from WordPress,
// stores sessions in Upstash Redis via REST API directly

// --- Upstash Redis helpers using REST API directly ---
async function redisGet(key) {
  const url = `${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  const data = await res.json();
  if (!data.result) return null;
  try {
    let value = data.result;
    while (typeof value === 'string') {
      value = JSON.parse(value);
    }
    // Unwrap outer {value, ex} wrapper if present
    if (value && typeof value.value === 'string') {
      value = JSON.parse(value.value);
    }
    return value;
  } catch (e) {
    console.error('redisGet parse error:', e.message);
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

// --- Mailchimp lookup: checks both audiences ---
async function getSubscriber(subscriberId) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const dc = apiKey.split('-')[1];

  const audiences = [
    process.env.MAILCHIMP_CLIENT_AUDIENCE_ID,
    process.env.MAILCHIMP_AUDIENCE_ID_2,
  ].filter(Boolean);

  for (const audienceId of audiences) {
    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members?unique_email_id=${subscriberId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok) {
      const data = await response.json();
      if (data.members && data.members.length > 0) {
        return data.members[0];
      }
    }
  }

  return null;
}

// --- Main handler ---
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { subscriberId, page } = req.body;

  if (!subscriberId || !page) {
    return res.status(400).json({ error: 'Missing subscriberId or page' });
  }

  // Check exclusion list
  const excluded = process.env.EXCLUDED_SUBSCRIBER_IDS || '';
  if (excluded.split(',').map(s => s.trim()).includes(subscriberId)) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const sessionKey = `session:${subscriberId}`;
  const existing = await redisGet(sessionKey);

  if (existing && existing.pages) {
    existing.pages.push({ page, time: Date.now() });
    existing.lastSeen = Date.now();
    await redisSet(sessionKey, existing, 3600);
  } else {
    const subscriber = await getSubscriber(subscriberId);
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    const session = {
      subscriber,
      pages: [{ page, time: Date.now() }],
      lastSeen: Date.now(),
      alerted: false,
    };
    await redisSet(sessionKey, session, 3600);
  }

  return res.status(200).json({ ok: true });
};
