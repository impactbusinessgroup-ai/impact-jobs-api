// api/contacts-fetch.js
// Cron job: finds new leads with no contacts, runs Apollo + Gemini pipeline
// to discover and store suggested hiring manager contacts. Falls back to Hunter.io.

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

function looseCompanyMatch(orgName, leadCompany) {
  if (!orgName || !leadCompany) return false;
  var a = orgName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  var b = leadCompany.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  return a.indexOf(b) !== -1 || b.indexOf(a) !== -1;
}

function generateTitlesPrompt(lead, cat, descSnippet) {
  return 'Analyze this job posting and determine who the hiring manager likely is.\n\n' +
    'Job Title: ' + lead.jobTitle + '\n' +
    'Category: ' + cat + '\n' +
    'Description: ' + descSnippet + '\n\n' +
    'Return ONLY a JSON object with:\n' +
    '{ "person_titles": [] }\n\n' +
    'person_titles: array of 6-8 specific job titles to search for. For example for a Manufacturing Engineer role return titles like ["Director of Engineering", "VP of Engineering", "Plant Manager", "Director of Manufacturing", "VP of Manufacturing", "Director of Operations", "Engineering Manager", "Manufacturing Manager"]. For IT roles include CTO, IT Director, VP of Technology, etc. For Accounting roles include CFO, Controller, VP of Finance, etc. Always include relevant operational leadership titles.\n\n' +
    'Use the reporting structure in the description if mentioned, otherwise infer from the job title and category.';
}

function generateValidationPrompt(lead, cat, descSnippet, contactList) {
  return 'You are selecting the best hiring manager contacts for a staffing agency reaching out about a ' + lead.jobTitle + ' role in ' + cat + ' at ' + lead.company + '.\n\n' +
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
}

function getDefaultTitles(cat) {
  if (cat === 'accounting') {
    return ['CFO', 'VP of Finance', 'Controller', 'Director of Finance', 'Director of Accounting', 'Accounting Manager'];
  } else if (cat === 'it') {
    return ['CTO', 'VP of Technology', 'IT Director', 'Director of IT', 'Director of Engineering', 'IT Manager'];
  }
  return ['Director of Engineering', 'VP of Engineering', 'Plant Manager', 'Director of Manufacturing', 'Director of Operations', 'Engineering Manager'];
}

// --- Apollo-based contact discovery ---
async function processLeadApollo(lead, cat, descSnippet) {
  var domain = lead.company_domain;

  // Step 1: Apollo org enrichment
  var orgRes = await fetch('https://api.apollo.io/api/v1/organizations/enrich?domain=' + encodeURIComponent(domain), {
    headers: { 'x-api-key': process.env.APOLLO_API_KEY }
  });

  if (!orgRes.ok) {
    console.log('Apollo org enrichment failed for', lead.company, orgRes.status);
    return null;
  }

  var orgData = await orgRes.json();
  var orgId = orgData.organization && orgData.organization.id;
  if (!orgId) {
    console.log('Apollo org enrichment returned no org for', lead.company);
    return null;
  }

  console.log('Apollo org ID for', lead.company, ':', orgId);

  // Step 2: Gemini title generation
  var titlesText = await callGemini(generateTitlesPrompt(lead, cat, descSnippet));
  var titlesData = parseGeminiJson(titlesText);
  var personTitles = (titlesData && titlesData.person_titles && titlesData.person_titles.length) ?
    titlesData.person_titles : getDefaultTitles(cat);

  // Step 3: Apollo people search by org ID
  var searchBody = {
    organization_ids: [orgId],
    person_titles: personTitles,
    per_page: 10
  };

  var apolloRes = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.APOLLO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(searchBody)
  });

  if (!apolloRes.ok) {
    console.error('Apollo people search failed for', lead.company, apolloRes.status);
    return null;
  }

  var apolloData = await apolloRes.json();
  var people = apolloData.people || [];
  var totalEntries = (apolloData.pagination && apolloData.pagination.total_entries != null) ? apolloData.pagination.total_entries : (apolloData.people ? apolloData.people.length : 0);
  console.log('Apollo people search result:', lead.company, '- total_entries:', totalEntries, '- first person:', people[0] ? JSON.stringify({ id: people[0].id, first_name: people[0].first_name, last_name: people[0].last_name, title: people[0].title, city: people[0].city, state: people[0].state, country: people[0].country, has_country: people[0].has_country, org: people[0].organization && people[0].organization.name }) : 'none');
  if (!people.length) {
    console.log('No Apollo people found for', lead.company);
    return null;
  }

  // Step 4: Filter - must have country, org name must loosely match
  var filtered = [];
  for (var i = 0; i < people.length; i++) {
    var p = people[i];
    if (p.has_country === false) continue;
    var pOrgName = (p.organization && p.organization.name) || '';
    if (pOrgName && !looseCompanyMatch(pOrgName, lead.company)) continue;
    filtered.push(p);
  }

  console.log('Apollo filter passed:', lead.company, '-', filtered.length, 'of', people.length, 'people');
  if (!filtered.length) {
    console.log('No Apollo people passed org/country filter for', lead.company);
    return null;
  }

  // Step 5: Location filtering
  var jobLoc = parseLocation(lead.location);
  var locFiltered = [];
  for (var li = 0; li < filtered.length; li++) {
    var person = filtered[li];
    var locMatch = getLocationMatch(person, jobLoc.city, jobLoc.state);
    if (locMatch && filterByTitleAndLocation(person, locMatch)) {
      locFiltered.push({ person: person, locationMatch: locMatch, index: li });
    }
  }

  var candidates = locFiltered.slice(0, 10);
  if (!candidates.length) {
    console.log('No location-matched Apollo people for', lead.company);
    return null;
  }

  // Step 6: Gemini validation
  var contactList = candidates.map(function(c, idx) {
    return idx + '. ' + (c.person.first_name || '') + ' ' + (c.person.last_name || '') + ' - ' + (c.person.title || 'Unknown') + ' (' + (c.person.city || '') + ', ' + (c.person.state || '') + ')';
  }).join('\n');

  var rankText = await callGemini(generateValidationPrompt(lead, cat, descSnippet, contactList));
  console.log('Gemini raw response:', rankText);
  var selectedIndexes = parseGeminiJson(rankText);
  if (!Array.isArray(selectedIndexes)) {
    console.log('Gemini parse error:', rankText);
    selectedIndexes = [0];
  }
  console.log('Gemini approved:', lead.company, '-', selectedIndexes, 'from', candidates.length, 'candidates');
  if (!selectedIndexes.length) {
    console.log('Gemini approved zero Apollo contacts for', lead.company);
    return null;
  }

  // Step 7: Build contact objects
  var contacts = [];
  for (var j = 0; j < selectedIndexes.length && contacts.length < 3; j++) {
    var idx = selectedIndexes[j];
    if (idx >= 0 && idx < candidates.length) {
      var cp = candidates[idx].person;
      contacts.push({
        apollo_id: cp.id || '',
        first_name: cp.first_name || '',
        last_name: cp.last_name || '',
        full_name: ((cp.first_name || '') + ' ' + (cp.last_name || '')).trim(),
        name: ((cp.first_name || '') + ' ' + (cp.last_name || '')).trim(),
        job_title: cp.title || '',
        title: cp.title || '',
        city: toTitleCase(cp.city || ''),
        state: toTitleCase(cp.state || ''),
        linkedin: ensureUrl(cp.linkedin_url || ''),
        email: null,
        emailInferred: false,
        locationMatch: candidates[idx].locationMatch,
        source: 'apollo'
      });
    }
  }

  // Extract company-level data from org enrichment
  var companyData = {};
  var org = orgData.organization;
  if (org) {
    if (org.website_url) companyData.company_website = ensureUrl(org.website_url);
    if (org.linkedin_url) companyData.company_linkedin = ensureUrl(org.linkedin_url);
    if (org.primary_domain) companyData.company_domain = org.primary_domain;
    if (org.logo_url) companyData.company_logo_apollo = ensureUrl(org.logo_url);
  }
  companyData.apollo_org_id = orgId;

  return contacts.length > 0 ? { contacts: contacts, companyData: companyData } : null;
}

// --- Hunter.io fallback ---
async function processLeadHunter(lead, cat, descSnippet) {
  var domain = lead.company_domain;

  var hunterUrl = 'https://api.hunter.io/v2/domain-search?domain=' + encodeURIComponent(domain) +
    '&type=personal&seniority=senior,executive&api_key=' + process.env.HUNTER_API_KEY;

  var hunterRes = await fetch(hunterUrl);
  if (!hunterRes.ok) {
    console.error('Hunter search failed for', lead.company, hunterRes.status);
    return null;
  }

  var hunterData = await hunterRes.json();
  var emails = (hunterData.data && hunterData.data.emails) || [];
  if (!emails.length) {
    console.log('No Hunter contacts found for', lead.company);
    return null;
  }

  var contactList = emails.map(function(e, idx) {
    return idx + '. ' + (e.first_name || '') + ' ' + (e.last_name || '') + ' - ' + (e.position || 'Unknown title') + ' (email: ' + (e.value || '') + ')';
  }).join('\n');

  var rankText = await callGemini(generateValidationPrompt(lead, cat, descSnippet, contactList));
  var selectedIndexes = parseGeminiJson(rankText);
  if (!Array.isArray(selectedIndexes) || !selectedIndexes.length) {
    console.log('Gemini approved zero Hunter contacts for', lead.company);
    return null;
  }

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

  var companyData = {};
  if (hunterData.data) {
    if (hunterData.data.domain) companyData.company_domain = hunterData.data.domain;
  }

  return contacts.length > 0 ? { contacts: contacts, companyData: companyData } : null;
}

// --- Main processing ---
async function processLead(lead) {
  var domain = lead.company_domain || '';
  if (!domain) {
    console.log('Skip ' + lead.company + ': no domain');
    return null;
  }

  var cat = lead.category || 'engineering';
  var descSnippet = (lead.description || '').slice(0, 1000);

  // Try Apollo first
  var result = await processLeadApollo(lead, cat, descSnippet);
  if (result) return result;

  // Fall back to Hunter
  console.log('Falling back to Hunter for', lead.company);
  return await processLeadHunter(lead, cat, descSnippet);
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
          if (result.companyData.apollo_org_id) lead.apollo_org_id = result.companyData.apollo_org_id;
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
