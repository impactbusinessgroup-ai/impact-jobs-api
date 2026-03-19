// api/cron.js
// Runs every minute via cron-job.org
// Checks Upstash Redis for sessions inactive 2+ minutes (testing) and fires alert emails

import nodemailer from 'nodemailer';

const SESSION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes (testing)

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
    // Keep parsing until we get a plain object
    while (typeof value === 'string') {
      value = JSON.parse(value);
    }
    return value;
  } catch (e) {
    console.error('redisGet parse error:', e);
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

// --- Send alert email via Gmail ---
async function sendAlert(subscriber, pages) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const name = `${subscriber.merge_fields.FNAME} ${subscriber.merge_fields.LNAME}`.trim() || subscriber.email_address;
  const company = subscriber.merge_fields.COMPANY || 'Unknown Company';
  const title = subscriber.merge_fields.JOBTITLE || '';
  const accountManager = subscriber.merge_fields.REPNAME || '';

  const pageList = pages
    .map(p => `<li>${p.page} &mdash; ${new Date(p.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</li>`)
    .join('');

  const html = `
    <h2>Client Visit Alert</h2>
    <p>
      <strong>${name}</strong>${title ? `, ${title}` : ''}<br>
      ${company}<br>
      ${accountManager ? `Account Manager: ${accountManager}` : ''}
    </p>
    <h3>Pages visited:</h3>
    <ul>${pageList}</ul>
    <p style="color:#999;font-size:12px;">iMPact client tracker &mdash; ${new Date().toLocaleDateString()}</p>
  `;

  await transporter.sendMail({
    from: `"iMPact Tracker" <${process.env.GMAIL_USER}>`,
    to: 'info@impactbusinessgroup.com',
    subject: `Client Visit: ${name} (${company})`,
    html,
  });
}

// --- Main handler ---
export default async function handler(req, res) {
  // Disable caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');

  // Security check
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const keys = await redisKeys('session:*');

  if (!keys.length) {
    return res.status(200).json({ ok: true, checked: 0 });
  }

  let alerted = 0;

  for (const key of keys) {
    const session = await redisGet(key);
    console.log('Session debug:', JSON.stringify({
  console.log('Session debug:', JSON.stringify({
      key,
      hasSession: !!session,
      alerted: session?.alerted,
      lastSeen: session?.lastSeen,
      inactive: Date.now() - Number(session?.lastSeen),
      timeout: SESSION_TIMEOUT_MS,
      rawKeys: session ? Object.keys(session) : [],
      sessionType: typeof session
    }));
    if (!session || session.alerted) continue;

    const inactive = Date.now() - Number(session.lastSeen);

    if (inactive >= SESSION_TIMEOUT_MS) {
      try {
        await sendAlert(session.subscriber, session.pages);
        session.alerted = true;
        await redisSet(key, session, 3600);
        alerted++;
      } catch (err) {
        console.error(`Failed to send alert for ${key}:`, err);
      }
    }
  }

  return res.status(200).json({ ok: true, checked: keys.length, alerted });
}
