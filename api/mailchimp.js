// api/mailchimp.js
// Consolidated Mailchimp handler: lookup (GET), add contact (POST action:"add"), update contact (POST action:"update")

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const dc = apiKey.split('-')[1];

  // ─── GET ?email= → Lookup ───
  if (req.method === 'GET') {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Missing email parameter' });

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
  }

  // ─── POST → Add or Update ───
  if (req.method === 'POST') {
    const { action } = req.body;

    if (action === 'add') {
      const {
        email, fname, lname, title, phone, company, source,
        repName, repTitle, repEmail, repPhone, repCalendly
      } = req.body;

      if (!email || !fname || !lname || !company) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const audienceId = process.env.MAILCHIMP_CLIENT_AUDIENCE_ID;
      const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          merge_fields: {
            FNAME: fname,
            LNAME: lname,
            JOBTITLE: title || '',
            PHNUMBER: phone || '',
            COMPANY: company,
            REPNAME: repName || '',
            REPTITLE: repTitle || '',
            REPEMAIL: repEmail || '',
            REPPHONE: repPhone || '',
            CALENDLY: repCalendly || '',
          },
          tags: ['Client', source ? source : ''].filter(Boolean),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return res.status(200).json({ unique_email_id: data.unique_email_id });
      } else {
        // Handle already subscribed case
        if (data.title === 'Member Exists') {
          return res.status(200).json({ error: 'This email is already in the client list. Try looking them up instead.' });
        }
        return res.status(400).json({ error: data.detail || 'Failed to add contact.' });
      }
    }

    if (action === 'update') {
      const {
        email, fname, lname, title, phone, company,
        repName, repTitle, repEmail, repPhone, repCalendly
      } = req.body;

      if (!email) return res.status(400).json({ error: 'Missing email' });

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
    }

    return res.status(400).json({ error: 'Invalid action. Use "add" or "update".' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
