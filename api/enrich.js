// api/enrich.js
// Enriches a contact via Explorium AgentSource API to find their verified email.
// Two-step process: match prospect by name + company, then enrich for contact info.

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

  var apiKey = process.env.EXPLORIUM_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'EXPLORIUM_API_KEY not configured' });

  try {
    // Step 1: Match prospect to get prospect_id
    var matchRes = await fetch('https://api.explorium.ai/v1/prospects/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': apiKey
      },
      body: JSON.stringify({
        request_context: {},
        prospects_to_match: [{
          full_name: body.contactName,
          company_name: body.companyName
        }]
      })
    });

    if (!matchRes.ok) {
      console.error('Explorium match failed:', matchRes.status);
      return res.status(200).json({ email: null });
    }

    var matchData = await matchRes.json();
    var matched = matchData.matched_prospects && matchData.matched_prospects[0];
    if (!matched || !matched.prospect_id) {
      return res.status(200).json({ email: null });
    }

    var prospectId = matched.prospect_id;

    // Step 2: Enrich prospect to get email
    var enrichRes = await fetch('https://api.explorium.ai/v1/prospects/contacts_information/enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': apiKey
      },
      body: JSON.stringify({
        prospect_id: prospectId,
        parameters: {
          contact_types: ['email']
        }
      })
    });

    if (!enrichRes.ok) {
      console.error('Explorium enrich failed:', enrichRes.status);
      return res.status(200).json({ email: null });
    }

    var enrichData = await enrichRes.json();
    var data = enrichData.data || {};

    // Prefer professional email, fall back to first email in list
    var email = data.professions_email || null;
    if (!email && data.emails && data.emails.length > 0) {
      email = data.emails[0].email || null;
    }

    return res.status(200).json({ email: email });
  } catch (e) {
    console.error('Explorium error:', e.message);
    return res.status(200).json({ email: null });
  }
};
