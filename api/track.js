// api/track.js
// Receives page visit pings from WordPress,
// stores sessions in Upstash Redis,
// and sends email alerts after 10 minutes of inactivity.

import nodemailer from 'nodemailer';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// --- Mailchimp lookup: checks both audiences ---
async function getSubscriber(subscriberId) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const dc = apiKey.split('-')[1];

  const audiences = [
    process.env.MAILCHIMP_CLIENT_AUDIENCE_ID,
    process.env.MAILCHIMP_AUDIENCE_ID_2,
  ].filter(Boolean);

  for (const audienceId of audiences) {
    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  }

  return null;
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

// --- Main handler ---
export default async function handler(req, res) {
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
  const existing = await redis.get(sessionKey);

  if (existing) {
    // Add page to existing session
    const session = existing;
    session.pages.push({ page, time: Date.now() });
    session.lastSeen = Date.now();
    await redis.set(sessionKey, session, { ex: 3600 }); // expire after 1 hour max
  } else {
    // New session -- look up subscriber
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
    await redis.set(sessionKey, session, { ex: 3600 });
  }

  return res.status(200).json({ ok: true });
}
