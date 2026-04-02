// api/contacts-fetch.js
// Cron job: finds new leads with no contacts, runs Gemini + Explorium pipeline
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

function parseLocation(locationStr) {
  if (!locationStr) return { city: '', state: '' };
  var parts = locationStr.split(',').map(function(s) { return s.trim(); });
  return {
    city: (parts[0] || '').toLowerCase(),
    state: (parts[1] || '').toLowerCase().replace(/^\s+/, '')
  };
}

function getLocationMatch(prospect, jobCity, jobState) {
  var pCity = (prospect.city || '').toLowerCase();
  var pState = (prospect.region_name || '').toLowerCase();
  var pCountry = (prospect.country_name || '').toLowerCase();

  if (pCountry && pCountry !== 'united states') return null;

  if (jobCity && pCity === jobCity) return 'city';
  if (jobState && pState === jobState) return 'state';
  return 'national';
}

function filterByLevelAndLocation(prospect, locationMatch) {
  if (!locationMatch) return false;
  var title = (prospect.job_title || '').toLowerCase();
  var level = (prospect.job_level_main || '').toLowerCase();

  if (level === 'vp' || level === 'c_suite' ||
      title.indexOf('vp') !== -1 || title.indexOf('vice president') !== -1 ||
      title.indexOf('c-suite') !== -1 || title.indexOf('chief') !== -1) {
    return true; // national OK
  }
  if (level === 'director' || title.indexOf('director') !== -1) {
    return locationMatch === 'city' || locationMatch === 'state';
  }
  // manager or below
  return locationMatch === 'city';
}

async function processLead(lead, apiKey) {
  // Step 1: Gemini analysis of job to determine target levels and department
  var descSnippet = (lead.description || '').slice(0, 1000);
  var analysisPrompt = 'Analyze this job posting and determine who the hiring manager likely is.\n\n' +
    'Job Title: ' + lead.jobTitle + '\n' +
    'Category: ' + (lead.category || 'engineering') + '\n' +
    'Description: ' + descSnippet + '\n\n' +
    'Return ONLY a JSON object with:\n' +
    '{ "job_levels": [], "department": "" }\n\n' +
    'job_levels: array of Explorium-compatible values from this list: ["manager", "director", "vp", "c_suite"]. ' +
    'Pick the levels most likely to be the hiring authority for this role. Usually 2-3 levels.\n' +
    'department: a single string like "engineering", "operations", "finance", "accounting", "information_technology".\n\n' +
    'Use the reporting structure in the description if mentioned, otherwise infer from the job title and category.';

  var analysisText = await callGemini(analysisPrompt);
  var analysis = parseGeminiJson(analysisText);
  if (!analysis || !analysis.job_levels || !analysis.job_levels.length) {
    // Default fallback
    analysis = { job_levels: ['manager', 'director'], department: lead.category || 'engineering' };
  }

  // Step 2: Match business in Explorium
  var matchRes = await fetch('https://api.explorium.ai/v1/businesses/match', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': apiKey
    },
    body: JSON.stringify({
      businesses_to_match: [{ name: lead.company }]
    })
  });

  if (!matchRes.ok) {
    console.error('Business match failed for', lead.company, matchRes.status);
    return null;
  }

  var matchData = await matchRes.json();
  var matched = matchData.matched_businesses && matchData.matched_businesses[0];
  if (!matched || !matched.business_id) {
    console.log('No business match for', lead.company);
    return null;
  }

  var businessId = matched.business_id;

  // Step 3: Fetch prospects from Explorium
  var prospectRes = await fetch('https://api.explorium.ai/v1/prospects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': apiKey
    },
    body: JSON.stringify({
      mode: 'full',
      page_size: 10,
      size: 10,
      filters: {
        business_id: { values: [businessId] },
        job_level: { values: analysis.job_levels },
        country_code: { values: ['us'] }
      }
    })
  });

  if (!prospectRes.ok) {
    console.error('Prospect fetch failed for', lead.company, prospectRes.status);
    return null;
  }

  var prospectData = await prospectRes.json();
  var prospects = prospectData.data || prospectData.prospects || [];
  if (!prospects.length) {
    console.log('No prospects found for', lead.company);
    return null;
  }

  // Location filtering
  var jobLoc = parseLocation(lead.location);
  var filtered = [];
  for (var i = 0; i < prospects.length; i++) {
    var p = prospects[i];
    var locMatch = getLocationMatch(p, jobLoc.city, jobLoc.state);
    if (locMatch && filterByLevelAndLocation(p, locMatch)) {
      filtered.push({ prospect: p, locationMatch: locMatch, index: i });
    }
  }

  // Take up to 3 candidates
  var candidates = filtered.slice(0, 3);
  if (!candidates.length) {
    console.log('No location-matched prospects for', lead.company);
    return null;
  }

  // Gemini ranking step
  var rankList = candidates.map(function(c, idx) {
    return (idx + 1) + '. ' + (c.prospect.full_name || 'Unknown') + ' - ' + (c.prospect.job_title || 'Unknown') + ' (' + (c.prospect.city || '') + ', ' + (c.prospect.region_name || '') + ')';
  }).join('\n');

  var rankPrompt = 'You are helping a recruiter find the hiring manager for this job.\n\n' +
    'Job Title: ' + lead.jobTitle + '\n' +
    'Description snippet: ' + descSnippet.slice(0, 500) + '\n\n' +
    'Candidate contacts at ' + lead.company + ':\n' + rankList + '\n\n' +
    'Pick the best 1-2 candidates who are most likely the hiring manager or decision maker for this role. ' +
    'Return ONLY a JSON array of the selected candidate numbers (1-indexed). Example: [1] or [1,3]';

  var rankText = await callGemini(rankPrompt);
  var selectedIndexes = parseGeminiJson(rankText);
  if (!Array.isArray(selectedIndexes) || !selectedIndexes.length) {
    selectedIndexes = [1]; // default to first
  }

  // Extract company-level data from first prospect
  var companyData = {};
  if (prospects.length > 0) {
    var firstP = prospects[0];
    if (firstP.company_website) companyData.company_website = firstP.company_website;
    if (firstP.company_linkedin) companyData.company_linkedin = firstP.company_linkedin;
  }

  // Build contact objects
  var contacts = [];
  for (var j = 0; j < selectedIndexes.length; j++) {
    var idx = selectedIndexes[j] - 1; // convert from 1-indexed
    if (idx >= 0 && idx < candidates.length) {
      var c = candidates[idx];
      var p = c.prospect;
      contacts.push({
        prospect_id: p.prospect_id || p.id || '',
        full_name: p.full_name || '',
        name: p.full_name || '',
        job_title: p.job_title || '',
        title: p.job_title || '',
        job_level_main: p.job_level_main || '',
        job_department_main: p.job_department_main || analysis.department || '',
        city: p.city || '',
        region_name: p.region_name || '',
        linkedin: p.linkedin || '',
        locationMatch: c.locationMatch,
        source: 'explorium'
      });
    }
  }

  // --- Email inference for contacts without verified email ---
  // TODO: Step 1 - SmartSearch email pattern check (placeholder for when API credentials are available)
  // if (process.env.SMARTSEARCH_API_KEY) {
  //   for (var ei = 0; ei < contacts.length; ei++) {
  //     var ssEmail = await smartSearchLookup(contacts[ei].full_name, companyData.company_website);
  //     if (ssEmail) { contacts[ei].email = ssEmail; contacts[ei].emailVerified = true; }
  //   }
  // }

  // Step 3 - Gemini pattern inference for contacts without verified email
  var emailDomain = '';
  if (companyData.company_website) {
    try { emailDomain = new URL(companyData.company_website).hostname.replace('www.', ''); } catch (e) {}
  }

  if (emailDomain) {
    // Collect any visible emails from all prospects for pattern examples
    var exampleEmails = [];
    for (var ei = 0; ei < prospects.length; ei++) {
      var pe = prospects[ei];
      if (pe.professional_email && pe.professional_email.indexOf('@') !== -1) {
        exampleEmails.push(pe.professional_email);
      }
      if (pe.email && pe.email.indexOf('@') !== -1) {
        exampleEmails.push(pe.email);
      }
    }
    // Deduplicate
    exampleEmails = exampleEmails.filter(function(v, i, a) { return a.indexOf(v) === i; });

    for (var ci = 0; ci < contacts.length; ci++) {
      if (contacts[ci].email || contacts[ci].emailVerified) continue;

      var inferPrompt = 'Given these email examples from employees at ' + lead.company + ': ' +
        (exampleEmails.length > 0 ? exampleEmails.join(', ') : 'none available') +
        '. What is the most likely email format for ' + contacts[ci].full_name + ' at this company? ' +
        'The company domain is ' + emailDomain + '. ' +
        'Common formats are first.last@domain.com, flast@domain.com, firstname@domain.com. ' +
        'Return only the inferred email address, nothing else. If you cannot determine a pattern with confidence, return null.';

      var inferResult = await callGemini(inferPrompt);
      if (inferResult && inferResult !== 'null' && inferResult.indexOf('@') !== -1) {
        var inferredEmail = inferResult.trim().toLowerCase().replace(/[<>"']/g, '');
        if (inferredEmail.indexOf('@') !== -1) {
          contacts[ci].inferredEmail = inferredEmail;
          contacts[ci].emailInferred = true;
        }
      }
    }
  }

  return contacts.length > 0 ? { contacts: contacts, companyData: companyData } : null;
}

module.exports = async function handler(req, res) {
  // Auth check
  var authHeader = req.headers['authorization'] || '';
  if (authHeader !== 'Bearer ' + process.env.JOBS_CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  var apiKey = process.env.EXPLORIUM_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'EXPLORIUM_API_KEY not configured' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  try {
    var keys = await redisKeys('lead:*');
    var processed = 0;
    var contactsFound = 0;
    var skipped = 0;

    for (var i = 0; i < keys.length; i++) {
      var lead = await redisGet(keys[i]);
      if (!lead) { skipped++; continue; }

      // Only process new leads with empty contacts
      if (lead.status !== 'new') { skipped++; continue; }
      if (lead.contacts && lead.contacts.length > 0) { skipped++; continue; }
      if (lead.contactsEnrichedAt) { skipped++; continue; }

      console.log('Processing contacts for:', lead.company, '-', lead.jobTitle);

      try {
        var result = await processLead(lead, apiKey);

        if (result && result.contacts && result.contacts.length > 0) {
          lead.contacts = result.contacts;
          if (result.companyData.company_website) lead.company_website = result.companyData.company_website;
          if (result.companyData.company_linkedin) lead.company_linkedin = result.companyData.company_linkedin;
          lead.contactsEnrichedAt = Date.now();
          await redisSet(keys[i], lead, 604800); // 7-day TTL
          contactsFound += result.contacts.length;
          console.log('Found', result.contacts.length, 'contacts for', lead.company);
        } else {
          // Mark as enriched even if no contacts found, so we don't retry
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

      // Rate limiting delay
      if (i < keys.length - 1) await delay(500);
    }

    return res.status(200).json({ ok: true, processed: processed, contactsFound: contactsFound, skipped: skipped });
  } catch (e) {
    console.error('Contacts fetch error:', e.message);
    return res.status(500).json({ error: 'Contacts fetch failed: ' + e.message });
  }
};
