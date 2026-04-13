// api/mailchimp.js
// Consolidated Mailchimp handler: lookup (GET), add contact (POST action:"add"), update contact (POST action:"update")

const crypto = require('crypto');

const AM_EMAIL_MAP = {
  'Doug Koetsier': 'dkoetsier@impactbusinessgroup.com',
  'Paul Kujawski': 'pkujawski@impactbusinessgroup.com',
  'Matt Peal': 'mpeal@impactbusinessgroup.com',
  'Lauren Sylvester': 'lsylvester@impactbusinessgroup.com',
  'Dan Teliczan': 'dteliczan@impactbusinessgroup.com',
  'Curt Willbrandt': 'cwillbrandt@impactbusinessgroup.com',
  'Trish Wangler': 'twangler@impactbusinessgroup.com',
  'Mark Herman': 'mherman@impactbusinessgroup.com',
  'Jamie Drajka': 'jdrajka@impactbusinessgroup.com',
  'Drew Bentsen': 'dbentsen@impactbusinessgroup.com',
  'Steve Betteley': 'sbetteley@impactbusinessgroup.com',
  'Drew Kunkel': 'mpeal@impactbusinessgroup.com',
};

async function searchAudienceByCompany(dc, apiKey, audienceId, company) {
  const encoded = encodeURIComponent(company);
  const url = `https://${dc}.api.mailchimp.com/3.0/search-members?query=${encoded}&list_id=${audienceId}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) return [];
  const data = await response.json();
  const members = (data.exact_matches && data.exact_matches.members) || [];
  const fuzzy = (data.full_search && data.full_search.members) || [];
  const all = [...members, ...fuzzy];
  return all.filter(m => {
    const co = (m.merge_fields && m.merge_fields.COMPANY || '').toLowerCase();
    return co === company.toLowerCase();
  });
}

async function companyLookup(dc, apiKey, company) {
  const audiences = [
    process.env.MAILCHIMP_CLIENT_AUDIENCE_ID,
    process.env.MAILCHIMP_AUDIENCE_ID_2,
  ].filter(Boolean);

  let allMatches = [];
  for (const audienceId of audiences) {
    const matches = await searchAudienceByCompany(dc, apiKey, audienceId, company);
    allMatches = allMatches.concat(matches);
  }

  if (!allMatches.length) return { found: false, repName: null, repEmail: null, contacts: [] };

  const repCounts = {};
  for (const m of allMatches) {
    const rep = m.merge_fields && m.merge_fields.REPNAME;
    if (rep) repCounts[rep] = (repCounts[rep] || 0) + 1;
  }

  let bestRep = null;
  let bestCount = 0;
  for (const rep in repCounts) {
    if (repCounts[rep] > bestCount) { bestCount = repCounts[rep]; bestRep = rep; }
  }

  const repEmail = bestRep ? (AM_EMAIL_MAP[bestRep] || null) : null;

  return {
    found: !!bestRep,
    repName: bestRep,
    repEmail,
    contactCount: allMatches.length,
    contacts: allMatches.map(m => ({
      email: m.email_address,
      name: (m.merge_fields.FNAME || '') + ' ' + (m.merge_fields.LNAME || ''),
      repName: m.merge_fields.REPNAME || '',
    })),
  };
}

async function updateCompanyRep(dc, apiKey, company, repName, repEmail, calendly) {
  const audiences = [
    process.env.MAILCHIMP_CLIENT_AUDIENCE_ID,
    process.env.MAILCHIMP_AUDIENCE_ID_2,
  ].filter(Boolean);

  let updated = 0;
  for (const audienceId of audiences) {
    const matches = await searchAudienceByCompany(dc, apiKey, audienceId, company);
    for (const m of matches) {
      const emailHash = crypto.createHash('md5').update(m.email_address.toLowerCase()).digest('hex');
      const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${emailHash}`;
      await fetch(url, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ merge_fields: { REPNAME: repName, REPEMAIL: repEmail, CALENDLY: calendly || '' } }),
      });
      updated++;
    }
  }
  return updated;
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const dc = apiKey.split('-')[1];

  // ─── GET ?action=company_lookup&company= → Company rep lookup ───
  if (req.method === 'GET' && req.query.action === 'company_lookup') {
    const company = req.query.company;
    if (!company) return res.status(400).json({ error: 'Missing company parameter' });
    try {
      const result = await companyLookup(dc, apiKey, company);
      return res.status(200).json(result);
    } catch (e) {
      console.error('Company lookup error:', e.message);
      return res.status(500).json({ error: 'Company lookup failed' });
    }
  }

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

    if (action === 'update_company_rep') {
      const { company, repName, repEmail, calendly } = req.body;
      if (!company || !repName) return res.status(400).json({ error: 'Missing company or repName' });
      try {
        const updated = await updateCompanyRep(dc, apiKey, company, repName, repEmail || '', calendly || '');
        return res.status(200).json({ ok: true, updated });
      } catch (e) {
        console.error('Update company rep error:', e.message);
        return res.status(500).json({ error: 'Failed to update company rep' });
      }
    }

    return res.status(400).json({ error: 'Invalid action. Use "add", "update", or "update_company_rep".' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
