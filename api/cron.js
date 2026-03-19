// api/cron.js
// Runs every minute via Vercel cron.
// Checks Redis for sessions inactive for 10+ minutes and fires alert emails.

import nodemailer from 'nodemailer';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

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
  const title = subscriber.merge_fields.TITLE || '';
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

export default async function handler(req, res) {
  // Only allow Vercel cron calls
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get all session keys from Redis
  const keys = await redis.keys('session:*');

  if (!keys.length) {
    return res.status(200).json({ ok: true, checked: 0 });
  }

  let alerted = 0;

  for (const key of keys) {
    const session = await redis.get(key);
    if (!session || session.alerted) continue;

    const inactive = Date.now() - session.lastSeen;

    if (inactive >= SESSION_TIMEOUT_MS) {
      try {
        await sendAlert(session.subscriber, session.pages);
        session.alerted = true;
        await redis.set(key, session, { ex: 3600 });
        alerted++;
      } catch (err) {
        console.error(`Failed to send alert for ${key}:`, err);
      }
    }
  }

  return res.status(200).json({ ok: true, checked: keys.length, alerted });
}
