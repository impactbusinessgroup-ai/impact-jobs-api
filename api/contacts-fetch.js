// api/contacts-fetch.js
// Cron job: finds new leads with no contacts, runs Hunter.io + Gemini pipeline
// to discover and store suggested hiring manager contacts.

async function redisGet(key) {
  var url = process.env.KV_REST_API_URL + '/get/' + encodeURIComponent(key);
  var res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN },
  });
  var data = await res.json();
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

async function redisSet(key, value, exSeconds) {
  var url = process.env.KV_REST_API_URL + '/set/' + encodeURIComponent(key);
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value: JSON.stringify(value), ex: exSeconds }),
  });
}

async function redisKeys(pattern) {
  var url = process.env.KV_REST_API_URL + '/keys/' + encodeURIComponent(pattern);
  var res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN },
  });
  var data = await res.json();
  return data.result || [];
}

function delay(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

async function callGemini(prompt) {
  var res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + process.env.GEMINI_API_KEY,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 400, temperature: 0.2 }
      })
    }
  );
  if (!res.ok) return null;
  var data = await res.json();
  var text = data.candidates && data.candidates[0] && data.candidates[0].content &&
             data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
             data.candidates[0].content.parts[0].text;
  return text ? text.trim() : null;
}

function parseGeminiJson(text) {
  if (!text) return null;
  var clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(clean); } catch (e) { return null; }
}

function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, function(t) { return t.charAt(0).toUpperCase() + t.substr(1).toLowerCase(); });
}

function ensureUrl(val) {
  if (!val) return '';
  if (val.indexOf('http') === 0) return val;
  return 'https://' + val;
}

function getDepartmentParam(category) {
  if (category === 'engineering') return 'engineering';
  if (category === 'it') return 'it';
  if (category === 'accounting') return 'finance';
  return '';
}

async function processLead(lead) {
  var domain = lead.company_domain || '';
  if (!domain) {
    console.log('Skip ' + lead.company + ': no domain');
    return null;
  }

  var cat = lead.category || 'engineering';

  // Step 1: Hunter.io domain search
  var hunterUrl = 'https://api.hunter.io/v2/domain-search?domain=' + encodeURIComponent(domain) +
    '&type=personal&seniority=senior,executive&api_key=' + process.env.HUNTER_API_KEY;

  var dept = getDepartmentParam(cat);
  if (dept) {
    hunterUrl += '&department=' + dept;
  }

  var hunterRes = await fetch(hunterUrl);
  if (!hunterRes.ok) {
    console.error('Hunter search failed for', lead.company, hunterRes.status);
    return null;
  }

  var hunterData = await hunterRes.json();
  console.log('Hunter raw response:', JSON.stringify(hunterData));
  var emails = (hunterData.data && hunterData.data.emails) || [];
  if (!emails.length) {
    console.log('No Hunter contacts found for', lead.company);
    return null;
  }

  // Step 2: Gemini validation - evaluate each contact's title against the job posting
  var descSnippet = (lead.description || '').slice(0, 1000);
  var contactList = emails.map(function(e, idx) {
    return idx + '. ' + (e.first_name || '') + ' ' + (e.last_name || '') + ' - ' + (e.position || 'Unknown title') + ' (email: ' + (e.value || '') + ')';
  }).join('\n');

  var validatePrompt = 'You are selecting the best hiring manager contacts for a staffing agency reaching out about a ' + lead.jobTitle + ' role in ' + cat + ' at ' + lead.company + '.\n\n' +
    'Job Title: ' + lead.jobTitle + '\n' +
    'Category: ' + cat + '\n' +
    'Description: ' + descSnippet + '\n\n' +
    'Evaluate each contact below. Approve ONLY contacts whose title suggests they would plausibly be a hiring manager for this specific role. It is OK to return zero contacts if none qualify.\n\n' +
    'Priority order for contact selection:\n' +
    '- For Engineering/Manufacturing roles: first priority is Director of Engineering, VP of Engineering, Director of Manufacturing, VP of Manufacturing, Plant Manager, Director of Operations, VP of Operations. Second priority is Engineering Manager, Operations Manager, Manufacturing Manager. Third and last priority only if nothing better exists: HR Director, Talent Acquisition Manager.\n' +
    '- For IT roles: first priority is CTO, VP of Engineering, VP of Technology, Director of IT, Director of Engineering, IT Director. Second priority is IT Manager, Engineering Manager, Development Manager. Last priority only if nothing better exists: HR Director, Talent Acquisition Manager.\n' +
    '- For Accounting/Finance roles: first priority is CFO, VP of Finance, Controller, Director of Finance, Director of Accounting. Second priority is Accounting Manager, Finance Manager. Last priority only if nothing better exists: HR Director.\n' +
    '- NEVER select: sales roles, channel partners, business development, marketing, customer success, or any role unrelated to the hiring department.\n\n' +
    'Candidate contacts:\n' + contactList + '\n\n' +
    'Return approved contacts ranked best first, maximum 3. Return ONLY a JSON array of indexes from the list, e.g. [0, 2]. Return [] if none qualify.';

  var rankText = await callGemini(validatePrompt);
  var selectedIndexes = parseGeminiJson(rankText);
  if (!Array.isArray(selectedIndexes) || !selectedIndexes.length) {
    console.log('Gemini approved zero contacts for', lead.company);
    return null;
  }

  // Step 3: Build contact objects from approved contacts
  var contacts = [];
  for (var j = 0; j < selectedIndexes.length && contacts.length < 3; j++) {
    var idx = selectedIndexes[j];
    if (idx >= 0 && idx < emails.length) {
      var e = emails[idx];
      var firstName = e.first_name || '';
      var lastName = e.last_name || '';
      contacts.push({
        first_name: firstName,
        last_name: lastName,
        full_name: ((firstName) + ' ' + (lastName)).trim(),
        name: ((firstName) + ' ' + (lastName)).trim(),
        job_title: e.position || '',
        title: e.position || '',
        email: e.value || '',
        emailInferred: false,
        linkedin: ensureUrl(e.linkedin || ''),
        source: 'hunter'
      });
    }
  }

  // Extract company-level data from Hunter response
  var companyData = {};
  if (hunterData.data) {
    if (hunterData.data.organization) companyData.company_website = ensureUrl(hunterData.data.organization || '');
    if (hunterData.data.domain) companyData.company_domain = hunterData.data.domain;
  }

  return contacts.length > 0 ? { contacts: contacts, companyData: companyData } : null;
}

module.exports = async function handler(req, res) {
  var authHeader = req.headers['authorization'] || '';
  if (authHeader !== 'Bearer ' + process.env.JOBS_CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.HUNTER_API_KEY) return res.status(500).json({ error: 'HUNTER_API_KEY not configured' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  try {
    var keys = await redisKeys('lead:*');
    var processed = 0;
    var contactsFound = 0;
    var skipped = 0;

    for (var i = 0; i < keys.length; i++) {
      var lead = await redisGet(keys[i]);
      if (!lead) { console.log('Skip ' + keys[i] + ': null lead'); skipped++; continue; }

      if (lead.status !== 'new') { console.log('Skip ' + lead.company + ': status=' + lead.status); skipped++; continue; }

      // Temporary: re-process leads from old Explorium pipeline
      var hasExploriumContacts = lead.contacts && lead.contacts.length > 0 && lead.contacts[0].source === 'explorium';
      var enrichedButEmpty = lead.contactsEnrichedAt && (!lead.contacts || lead.contacts.length === 0);
      var needsReprocess = hasExploriumContacts || enrichedButEmpty;

      if (!needsReprocess) {
        if (lead.contacts && lead.contacts.length > 0) { console.log('Skip ' + lead.company + ': already has ' + lead.contacts.length + ' contacts (source=' + lead.contacts[0].source + ')'); skipped++; continue; }
        if (lead.contactsEnrichedAt) { console.log('Skip ' + lead.company + ': already enriched at ' + new Date(lead.contactsEnrichedAt).toISOString()); skipped++; continue; }
      } else {
        console.log('Reprocessing ' + lead.company + ': ' + (hasExploriumContacts ? 'explorium contacts' : 'enriched but empty'));
      }

      console.log('Processing contacts for:', lead.company, '-', lead.jobTitle);

      try {
        var result = await processLead(lead);

        if (result && result.contacts && result.contacts.length > 0) {
          lead.contacts = result.contacts;
          if (result.companyData.company_website) lead.company_website = result.companyData.company_website;
          if (result.companyData.company_domain) lead.company_domain = result.companyData.company_domain;
          lead.contactsEnrichedAt = Date.now();
          await redisSet(keys[i], lead, 604800);
          contactsFound += result.contacts.length;
          console.log('Found', result.contacts.length, 'contacts for', lead.company);
        } else {
          lead.contactsEnrichedAt = Date.now();
          lead.contacts = [];
          await redisSet(keys[i], lead, 604800);
          console.log('No contacts found for', lead.company);
        }

        processed++;
      } catch (e) {
        console.error('Error processing lead', lead.company, ':', e.message);
        skipped++;
      }

      if (i < keys.length - 1) await delay(500);
    }

    return res.status(200).json({ ok: true, processed: processed, contactsFound: contactsFound, skipped: skipped });
  } catch (e) {
    console.error('Contacts fetch error:', e.message);
    return res.status(500).json({ error: 'Contacts fetch failed: ' + e.message });
  }
};
