// api/update-contact.js
// Updates an existing Mailchimp contact's merge fields

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    email, fname, lname, title, phone, company,
    repName, repTitle, repEmail, repPhone, repCalendly
  } = req.body;

  if (!email) return res.status(400).json({ error: 'Missing email' });

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const dc = apiKey.split('-')[1];

  const audiences = [
    process.env.MAILCHIMP_CLIENT_AUDIENCE_ID,
    process.env.MAILCHIMP_AUDIENCE_ID_2,
  ].filter(Boolean);

  const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

  for (const audienceId of audiences) {
    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${emailHash}`;

    // Check if member exists in this audience
    const check = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (check.ok) {
      // Update the member
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merge_fields: {
            FNAME: fname || '',
            LNAME: lname || '',
            JOBTITLE: title || '',
            PHNUMBER: phone || '',
            COMPANY: company || '',
            REPNAME: repName || '',
            REPTITLE: repTitle || '',
            REPEMAIL: repEmail || '',
            REPPHONE: repPhone || '',
            CALENDLY: repCalendly || '',
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return res.status(200).json({ updated: true });
      } else {
        return res.status(400).json({ error: data.detail || 'Failed to update contact.' });
      }
    }
  }

  return res.status(404).json({ error: 'Contact not found.' });
};
