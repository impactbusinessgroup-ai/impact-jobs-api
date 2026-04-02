// api/enrich.js
// Enriches a contact via Apollo People Match API to find their verified email.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var body = req.body;
  if (!body || !body.contactName || !body.companyName) {
    return res.status(400).json({ error: 'Missing contactName or companyName' });
  }

  var apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'APOLLO_API_KEY not configured' });

  try {
    var apolloId = body.prospect_id || body.apollo_id || null;
    var matchBody = {};

    if (apolloId) {
      // Match by Apollo ID
      matchBody = {
        id: apolloId,
        reveal_personal_emails: false,
        reveal_phone_number: false
      };
    } else {
      // Match by name + company
      var nameParts = body.contactName.trim().split(' ');
      var firstName = nameParts[0] || '';
      var lastName = nameParts.slice(1).join(' ') || '';
      var domain = '';
      if (body.companyName) {
        domain = body.companyName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) + '.com';
      }
      matchBody = {
        first_name: firstName,
        last_name: lastName,
        organization_name: body.companyName,
        domain: domain,
        reveal_personal_emails: false,
        reveal_phone_number: false
      };
    }

    var matchRes = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(matchBody)
    });

    if (!matchRes.ok) {
      console.error('Apollo match failed:', matchRes.status);
      return res.status(200).json({ email: null });
    }

    var matchData = await matchRes.json();
    var person = matchData.person || matchData;
    var email = person.email || null;

    return res.status(200).json({ email: email });
  } catch (e) {
    console.error('Apollo error:', e.message);
    return res.status(200).json({ email: null });
  }
};
