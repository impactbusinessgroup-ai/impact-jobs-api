// api/contacts-fetch.js
// Cron job: finds new leads with no contacts, runs Gemini + Apollo pipeline
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

function parseLocation(locationStr) {
  if (!locationStr) return { city: '', state: '' };
  var parts = locationStr.split(',').map(function(s) { return s.trim(); });
  return {
    city: (parts[0] || '').toLowerCase(),
    state: (parts[1] || '').toLowerCase().replace(/^\s+/, '')
  };
}

function getLocationMatch(person, jobCity, jobState) {
  var pCity = (person.city || '').toLowerCase();
  var pState = (person.state || '').toLowerCase();
  var pCountry = (person.country || '').toLowerCase();

  if (pCountry && pCountry !== 'united states' && pCountry !== 'us') return null;

  if (jobCity && pCity === jobCity) return 'city';
  if (jobState && pState === jobState) return 'state';
  return 'national';
}

function filterByTitleAndLocation(person, locationMatch) {
  if (!locationMatch) return false;
  var title = (person.title || '').toLowerCase();

  if (title.indexOf('vp') !== -1 || title.indexOf('vice president') !== -1 ||
      title.indexOf('chief') !== -1 || title.indexOf('cto') !== -1 ||
      title.indexOf('cfo') !== -1 || title.indexOf('coo') !== -1) {
    return true; // national OK
  }
  if (title.indexOf('director') !== -1) {
    return locationMatch === 'city' || locationMatch === 'state';
  }
  // manager or below
  return locationMatch === 'city';
}

async function processLead(lead) {
  // Step 1: Gemini analysis of job to determine target titles and department
  var descSnippet = (lead.description || '').slice(0, 1000);
  var cat = lead.category || 'engineering';
  var analysisPrompt = 'Analyze this job posting and determine who the hiring manager likely is.\n\n' +
    'Job Title: ' + lead.jobTitle + '\n' +
    'Category: ' + cat + '\n' +
    'Description: ' + descSnippet + '\n\n' +
    'Return ONLY a JSON object with:\n' +
    '{ "job_levels": [], "department": "", "person_titles": [] }\n\n' +
    'job_levels: array from this list: ["manager", "director", "vp", "c_suite"]. Pick 2-3 levels.\n' +
    'department: a single string like "engineering", "operations", "finance", "accounting", "information_technology".\n' +
    'person_titles: array of 6-8 specific job titles to search for. For example for a Manufacturing Engineer role return titles like ["Director of Engineering", "VP of Engineering", "Plant Manager", "Director of Manufacturing", "VP of Manufacturing", "Director of Operations", "Engineering Manager", "Manufacturing Manager"]. For IT roles include CTO, IT Director, VP of Technology, etc. For Accounting roles include CFO, Controller, VP of Finance, etc. Always include relevant operational leadership titles.\n\n' +
    'Use the reporting structure in the description if mentioned, otherwise infer from the job title and category.';

  var analysisText = await callGemini(analysisPrompt);
  var analysis = parseGeminiJson(analysisText);
  if (!analysis || !analysis.person_titles || !analysis.person_titles.length) {
    // Default fallback based on category
    var defaultTitles = [];
    if (cat === 'accounting') {
      defaultTitles = ['CFO', 'VP of Finance', 'Controller', 'Director of Finance', 'Director of Accounting', 'Accounting Manager'];
    } else if (cat === 'it') {
      defaultTitles = ['CTO', 'VP of Technology', 'IT Director', 'Director of IT', 'Director of Engineering', 'IT Manager'];
    } else {
      defaultTitles = ['Director of Engineering', 'VP of Engineering', 'Plant Manager', 'Director of Manufacturing', 'Director of Operations', 'Engineering Manager'];
    }
    analysis = { job_levels: ['manager', 'director'], department: cat, person_titles: defaultTitles };
  }

  // Step 2: Apollo People Search
  var searchBody = {
    person_titles: analysis.person_titles,
    organization_names: [lead.company],
    per_page: 10
  };
  if (lead.location) {
    searchBody.person_locations = [lead.location];
  }

  var apolloRes = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.APOLLO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(searchBody)
  });

  if (!apolloRes.ok) {
    console.error('Apollo search failed for', lead.company, apolloRes.status);
    return null;
  }

  var apolloData = await apolloRes.json();
  var people = apolloData.people || [];
  if (!people.length) {
    console.log('No people found for', lead.company);
    return null;
  }

  // Extract company-level data from first person's account
  var companyData = {};
  var firstAccount = people[0] && people[0].organization;
  if (firstAccount) {
    if (firstAccount.website_url) companyData.company_website = ensureUrl(firstAccount.website_url);
    if (firstAccount.linkedin_url) companyData.company_linkedin = ensureUrl(firstAccount.linkedin_url);
    if (firstAccount.primary_domain) companyData.company_domain = firstAccount.primary_domain;
    if (firstAccount.logo_url) companyData.company_logo_apollo = ensureUrl(firstAccount.logo_url);
  }

  // Step 3: Location filtering
  var jobLoc = parseLocation(lead.location);
  var filtered = [];
  for (var i = 0; i < people.length; i++) {
    var p = people[i];
    var locMatch = getLocationMatch(p, jobLoc.city, jobLoc.state);
    if (locMatch && filterByTitleAndLocation(p, locMatch)) {
      filtered.push({ person: p, locationMatch: locMatch, index: i });
    }
  }

  // Pass up to 10 candidates to Gemini for ranking
  var candidates = filtered.slice(0, 10);
  if (!candidates.length) {
    console.log('No location-matched people for', lead.company);
    return null;
  }

  // Step 4: Gemini ranking
  var rankList = candidates.map(function(c, idx) {
    return idx + '. ' + (c.person.first_name || '') + ' ' + (c.person.last_name || '') + ' - ' + (c.person.title || 'Unknown') + ' (' + (c.person.city || '') + ', ' + (c.person.state || '') + ')';
  }).join('\n');

  var rankPrompt = 'You are selecting the best hiring manager contacts for a staffing agency reaching out about a ' + lead.jobTitle + ' role in ' + cat + ' at ' + lead.company + '.\n\n' +
    'Priority order for contact selection:\n' +
    '- For Engineering/Manufacturing roles: first priority is Director of Engineering, VP of Engineering, Director of Manufacturing, VP of Manufacturing, Plant Manager, Director of Operations, VP of Operations. Second priority is Engineering Manager, Operations Manager, Manufacturing Manager. Third and last priority only if nothing better exists: HR Director, Talent Acquisition Manager.\n' +
    '- For IT roles: first priority is CTO, VP of Engineering, VP of Technology, Director of IT, Director of Engineering, IT Director. Second priority is IT Manager, Engineering Manager, Development Manager. Last priority only if nothing better exists: HR Director, Talent Acquisition Manager.\n' +
    '- For Accounting/Finance roles: first priority is CFO, VP of Finance, Controller, Director of Finance, Director of Accounting. Second priority is Accounting Manager, Finance Manager. Last priority only if nothing better exists: HR Director.\n' +
    '- NEVER select: sales roles, channel partners, business development, marketing, customer success, or any role unrelated to the hiring department.\n\n' +
    'Candidate contacts:\n' + rankList + '\n\n' +
    'Return 2-3 contacts if available, ranked by priority. Return ONLY a JSON array of prospect indexes from the provided list, e.g. [0, 2]. Maximum 3 contacts.';

  var rankText = await callGemini(rankPrompt);
  var selectedIndexes = parseGeminiJson(rankText);
  if (!Array.isArray(selectedIndexes) || !selectedIndexes.length) {
    selectedIndexes = [0];
  }

  // Step 5: Build contact objects
  var contacts = [];
  for (var j = 0; j < selectedIndexes.length && contacts.length < 3; j++) {
    var idx = selectedIndexes[j];
    if (idx >= 0 && idx < candidates.length) {
      var c = candidates[idx];
      var p = c.person;
      contacts.push({
        apollo_id: p.id || '',
        first_name: p.first_name || '',
        last_name: p.last_name || '',
        full_name: ((p.first_name || '') + ' ' + (p.last_name || '')).trim(),
        name: ((p.first_name || '') + ' ' + (p.last_name || '')).trim(),
        job_title: p.title || '',
        title: p.title || '',
        city: toTitleCase(p.city || ''),
        state: toTitleCase(p.state || ''),
        region_name: toTitleCase(p.state || ''),
        linkedin: ensureUrl(p.linkedin_url || ''),
        locationMatch: c.locationMatch,
        source: 'apollo'
      });
    }
  }

  // Step 6: Email inference for contacts without verified email
  var emailDomain = companyData.company_domain || '';
  if (!emailDomain && companyData.company_website) {
    try { emailDomain = new URL(companyData.company_website).hostname.replace('www.', ''); } catch (e) {}
  }

  if (emailDomain) {
    // Collect any visible emails from Apollo people for pattern examples
    var exampleEmails = [];
    for (var ei = 0; ei < people.length; ei++) {
      var pe = people[ei];
      if (pe.email && pe.email.indexOf('@') !== -1) {
        exampleEmails.push(pe.email);
      }
    }
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
  var authHeader = req.headers['authorization'] || '';
  if (authHeader !== 'Bearer ' + process.env.JOBS_CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.APOLLO_API_KEY) return res.status(500).json({ error: 'APOLLO_API_KEY not configured' });
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
          if (result.companyData.company_linkedin) lead.company_linkedin = result.companyData.company_linkedin;
          if (result.companyData.company_domain) lead.company_domain = result.companyData.company_domain;
          if (result.companyData.company_logo_apollo) lead.company_logo_apollo = result.companyData.company_logo_apollo;
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
