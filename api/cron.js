// api/cron.js
// Runs every minute via cron-job.org
// Checks Upstash Redis for sessions inactive 10+ minutes and fires alert emails

import nodemailer from 'nodemailer';

const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// --- Upstash Redis helpers using REST API directly ---
async function redisGet(key) {
  const url = `${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  const data = await res.json();
  if (!data.result) return null;
  return JSON.parse(data.result);
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
    to: 'info@impactbusines
