// api/lookup.js
// Looks up a Mailchimp contact by email using MD5 hash (exact match)

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Missing email parameter' });

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const dc = apiKey.split('-')[1];

  const audiences = [
    process.env.MAILCHIMP_CLIENT_AUDIENCE_ID,
    process.env.MAILCHIMP_AUDIENCE_ID_2,
  ].filter(Boolean);

  // Mailchimp uses MD5 hash of lowercase email to identify members
  const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

  for (const audienceId of audiences) {
    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${emailHash}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (response.ok) {
      const member = await response.json();
      return res.status(200).json({ found: true, member });
    }
  }

  return res.status(200).json({ found: false });
};
