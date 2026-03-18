// api/track.js
// Receives page visit pings from the WordPress site,
// looks up the subscriber in Mailchimp, and sends an email alert
// after 10 minutes of inactivity (session window).

const nodemailer = require('nodemailer');

// In-memory session store: { subscriberId: { subscriber, pages, timer } }
const sessions = {};

// How long to wait after last ping before firing the alert (10 minutes)
const SESSION_TIMEOUT_MS = 10 * 60 * 1000;

// --- Mailchimp lookup ---
async function getSubscriber(subscriberId) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_CLIENT_AUDIENCE_ID;
  const dc = apiKey.split('-')[1]; // e.g. us15

  const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberId}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) return null;
  return await response.json();
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
  // Allow requests from your WordPress site
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { subscriberId, page } = req.body;

  if (!subscriberId || !page) {
    return res.status(400).json({ error: 'Missing subscriberId or page' });
  }

  // If a session exists, clear the existing timer and add the page
  if (sessions[subscriberId]) {
    clearTimeout(sessions[subscriberId].timer);
    sessions[subscriberId].pages.push({ page, time: Date.now() });
  } else {
    // New session -- look up subscriber in Mailchimp
    const subscriber = await getSubscriber(subscriberId);
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    sessions[subscriberId] = {
      subscriber,
      pages: [{ page, time: Date.now() }],
      timer: null,
    };
  }

  // Set/reset the 10-minute inactivity timer
  sessions[subscriberId].timer = setTimeout(async () => {
    const { subscriber, pages } = sessions[subscriberId];
    delete sessions[subscriberId];
    try {
      await sendAlert(subscriber, pages);
    } catch (err) {
      console.error('Failed to send alert:', err);
    }
  }, SESSION_TIMEOUT_MS);

  return res.status(200).json({ ok: true });
}
