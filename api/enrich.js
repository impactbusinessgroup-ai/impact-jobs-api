// api/enrich.js
// Enriches a contact via Apollo People Match API to find their verified email.

async function redisGet(key) {
  var url = process.env.KV_REST_API_URL + '/get/' + encodeURIComponent(key);
  var r = await fetch(url, {
    headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN },
  });
  var data = await r.json();
  if (!data.result) return null;
  try {
    var value = data.result;
    while (typeof value === 'string') value = JSON.parse(value);
    if (value && typeof value.value === 'string') value = JSON.parse(value.value);
    return value;
  } catch (e) {
    return null;
  }
}

async function redisSetNoTTL(key, value) {
  var url = process.env.KV_REST_API_URL + '/set/' + encodeURIComponent(key);
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  console.log('Enrich incoming body:', JSON.stringify(req.body));

  var body = req.body;
  if (!body || !body.contactName || !body.companyName) {
    return res.status(400).json({ error: 'Missing contactName or companyName' });
  }

  var apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'APOLLO_API_KEY not configured' });

  try {
    var apolloId = body.prospect_id || body.apollo_id || null;
    var matchBody = {};

    console.log('Enrich taking path:', apolloId ? 'Path 1 - Apollo ID' : 'Path 2 - name+company');

    if (apolloId) {
      // Match by Apollo ID
      matchBody = {
        id: apolloId,
        reveal_personal_emails: true,
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
        reveal_personal_emails: true,
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

    // Write to contacts cache if email was found and we have a lead ID
    if (email && body.leadId) {
      try {
        var lead = await redisGet(body.leadId);
        var cacheDomain = lead && lead.company_domain;
        if (cacheDomain) {
          var cacheKey = 'contacts_cache:' + cacheDomain;
          var cache = await redisGet(cacheKey) || { domain: cacheDomain, contacts: [] };
          var contactEntry = {
            apollo_id: apolloId || person.id || '',
            full_name: body.contactName || '',
            job_title: body.contactTitle || '',
            city: person.city || '',
            state: person.state || '',
            linkedin: person.linkedin_url || '',
            email: email,
            previousJobs: [{ jobTitle: lead.jobTitle || '', date: lead.date || '' }]
          };
          var existingIdx = cache.contacts.findIndex(function(c) { return c.apollo_id === contactEntry.apollo_id; });
          if (existingIdx >= 0) {
            // Append job to existing contact's previousJobs
            cache.contacts[existingIdx].previousJobs = cache.contacts[existingIdx].previousJobs || [];
            cache.contacts[existingIdx].previousJobs.push({ jobTitle: lead.jobTitle || '', date: lead.date || '' });
          } else {
            cache.contacts.push(contactEntry);
          }
          await redisSetNoTTL(cacheKey, JSON.stringify(cache));
          console.log('Contacts cache updated for', cacheDomain, '-', body.contactName);
        }
      } catch (cacheErr) {
        console.error('Cache write error:', cacheErr.message);
      }
    }

    return res.status(200).json({ email: email });
  } catch (e) {
    console.error('Apollo error:', e.message);
    return res.status(200).json({ email: null });
  }
};
