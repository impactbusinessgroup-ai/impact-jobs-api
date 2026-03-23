// api/add-contact.js
// Adds a new contact to the Mailchimp client audience
// Returns the unique_email_id for tracking link generation

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

const {
    email, fname, lname, title, phone, company, source,
    repName, repTitle, repEmail, repPhone, repCalendly
  } = req.body;

  if (!email || !fname || !lname || !company) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const dc = apiKey.split('-')[1];
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
      tags: ['Client'],
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
};
