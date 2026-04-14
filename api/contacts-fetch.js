// api/contacts-fetch.js
// Cron job: finds new leads with no contacts, runs Apollo + Gemini pipeline
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

async function callGemini(prompt, maxTokens) {
  var keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(Boolean);
  for (var k = 0; k < keys.length; k++) {
    var res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + keys[k],
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens || 400, temperature: 0.2 }
        })
      }
    );
    if (res.status === 429 && k < keys.length - 1) { console.log('Gemini 429, retrying with backup key'); continue; }
    if (!res.ok) return null;
    var data = await res.json();
    var text = data.candidates && data.candidates[0] && data.candidates[0].content &&
               data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
               data.candidates[0].content.parts[0].text;
    return text ? text.trim() : null;
  }
  return null;
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

function extractState(location) {
  if (!location) return '';
  var parts = location.split(',');
  return (parts[1] || '').trim();
}

function getDefaultTitles() {
  return ['Director', 'VP', 'Manager', 'President', 'General Manager'];
}

async function processLead(lead, leadKey) {
  var domain = lead.company_domain || '';
  if (!domain) {
    console.log('Skip ' + lead.company + ': no org ID');
    return null;
  }

  // Check contacts cache for this domain
  var cachedContacts = [];
  try {
    var cache = await redisGet('contacts_cache:' + domain);
    if (cache && cache.contacts && cache.contacts.length > 0) {
      cachedContacts = cache.contacts.map(function(c) {
        return {
          apollo_id: c.apollo_id || '',
          first_name: (c.full_name || '').split(' ')[0] || '',
          last_name: (c.full_name || '').split(' ').slice(1).join(' ') || '',
          full_name: c.full_name || '',
          name: c.full_name || '',
          job_title: c.job_title || '',
          title: c.job_title || '',
          city: c.city || '',
          state: c.state || '',
          country: '',
          linkedin: c.linkedin || '',
          photo_url: c.photo_url || '',
          email: null,
          emailInferred: false,
          source: 'apollo',
          fromCache: true,
          previousJobs: c.previousJobs || []
        };
      });
      console.log('Cache hit for', lead.company, '(' + domain + '):', cachedContacts.length, 'contacts');
    }
  } catch (e) {
    console.log('Cache check error for', domain, ':', e.message);
  }

  var cat = lead.category || 'engineering';
  var description = lead.description || '';

  // Step 1: Get Apollo org ID (1 credit)
  var orgId = lead.apollo_org_id || null;

  if (!orgId) {
    var orgRes = await fetch('https://api.apollo.io/api/v1/organizations/enrich?domain=' + encodeURIComponent(domain), {
      headers: { 'x-api-key': process.env.APOLLO_API_KEY }
    });

    if (!orgRes.ok) {
      console.log('Skip ' + lead.company + ': no org ID');
      return null;
    }

    var orgData = await orgRes.json();
    orgId = orgData.organization && orgData.organization.id;
    if (!orgId) {
      console.log('Skip ' + lead.company + ': no org ID');
      return null;
    }

    // Store org ID and company LinkedIn on lead
    lead.apollo_org_id = orgId;
    var orgLinkedin = orgData.organization && orgData.organization.linkedin_url;
    if (orgLinkedin) lead.company_linkedin = orgLinkedin;
    await redisSet(leadKey, lead, 604800);
    console.log('Apollo org ID for', lead.company, ':', orgId);
  } else {
    console.log('Using cached org ID for', lead.company, ':', orgId);
    // Backfill company_linkedin if missing despite having org ID
    if (!lead.company_linkedin) {
      try {
        var orgRes2 = await fetch('https://api.apollo.io/api/v1/organizations/enrich?domain=' + encodeURIComponent(domain), {
          headers: { 'x-api-key': process.env.APOLLO_API_KEY }
        });
        if (orgRes2.ok) {
          var orgData2 = await orgRes2.json();
          var orgLinkedin2 = orgData2.organization && orgData2.organization.linkedin_url;
          if (orgLinkedin2) {
            lead.company_linkedin = orgLinkedin2;
            await redisSet(leadKey, lead, 604800);
            console.log('Backfilled company_linkedin for', lead.company, ':', orgLinkedin2);
          }
        }
      } catch (e) {
        console.log('company_linkedin backfill error:', e.message);
      }
    }
  }

  // Step 2: Gemini generates broad title keywords
  var feedbackSummary = '';
  try {
    var feedback = await redisGet('contact_feedback');
    if (Array.isArray(feedback) && feedback.length > 0) {
      var catFeedback = feedback.filter(function(f) { return f.category === cat; });
      var titleCounts = {};
      catFeedback.forEach(function(f) {
        var key = f.title + '|' + f.signal;
        titleCounts[key] = (titleCounts[key] || 0) + 1;
      });
      var positives = [];
      var negatives = [];
      Object.keys(titleCounts).forEach(function(key) {
        if (titleCounts[key] >= 3) {
          var parts = key.split('|');
          if (parts[1] === 'positive') positives.push(parts[0]);
          else if (parts[1] === 'mild_negative') negatives.push(parts[0]);
        }
      });
      if (positives.length > 0 || negatives.length > 0) {
        var summaryParts = [];
        if (positives.length) summaryParts.push('Titles that have performed well: ' + positives.join(', '));
        if (negatives.length) summaryParts.push('Titles that have underperformed: ' + negatives.join(', '));
        feedbackSummary = summaryParts.join('. ') + '.';
      }
    }
  } catch (e) {
    console.log('Feedback read error:', e.message);
  }

  var titlesPrompt = 'You are helping a staffing agency find hiring decision makers for this job posting. Read the full job description carefully and determine what type of role this is and who within the company would likely be involved in hiring for it.\n\nGenerate 8-12 search keywords representing the titles of people who would be hiring decision makers for this role. Think broadly -- a manufacturing engineer might report to a Plant Manager, Engineering Manager, Director of Manufacturing, or VP of Operations depending on the company. Cast a wide net with varied title keywords so we can find whoever holds that responsibility at this specific type of company.\n\nJob title: ' + lead.jobTitle + '\nCompany: ' + lead.company + '\nFull job description: ' + description + '\n\nReturn only a JSON array of title keyword phrases, no other text.';
  if (feedbackSummary) titlesPrompt += '\n\nNote from past outreach performance: ' + feedbackSummary;

  console.log('Gemini title prompt length:', lead.company, '-', titlesPrompt.length, 'chars');
  var titlesText = await callGemini(titlesPrompt, 1000);
  if (!titlesText) {
    console.log('Gemini title generation retry for', lead.company);
    await delay(1000);
    titlesText = await callGemini(titlesPrompt, 1000);
  }
  console.log('Gemini titles raw:', lead.company, '-', titlesText);
  var personTitles = parseGeminiJson(titlesText);
  if (!Array.isArray(personTitles) || !personTitles.length) {
    console.log('Gemini title generation failed for', lead.company, ', using defaults:', JSON.stringify(getDefaultTitles()));
    personTitles = getDefaultTitles();
  }

  console.log('Gemini titles:', lead.company, '-', JSON.stringify(personTitles));

  // Step 3: Apollo people search (free)
  var jobState = extractState(lead.location);
  var searchBody = {
    organization_ids: [orgId],
    person_titles: personTitles,
    per_page: 10
  };
  if (jobState) {
    searchBody.person_locations = [jobState + ', United States'];
  }
  console.log('Apollo location filter:', lead.company, '-', searchBody.person_locations || '(none)');

  var apolloRes = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.APOLLO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(searchBody)
  });

  if (!apolloRes.ok) {
    console.log('No Apollo people found for', lead.company);
    return null;
  }

  var apolloData = await apolloRes.json();
  var people = apolloData.people || [];
  var total = (apolloData.pagination && apolloData.pagination.total_entries != null) ? apolloData.pagination.total_entries : people.length;
  console.log('Apollo search result:', lead.company, '-', total, 'people found');

  if (!people.length) {
    console.log('No Apollo people found for', lead.company);
    return null;
  }

  // Step 4: Gemini validates and selects best contacts
  var contactList = people.map(function(p, idx) {
    return idx + '. ' + (p.first_name || '') + ' ' + (p.last_name || '') + ' - ' + (p.title || 'Unknown');
  }).join('\n');

  var validatePrompt = 'Given this job posting for ' + lead.jobTitle + ' at ' + lead.company + ', which of these contacts are most likely to be the hiring manager or decision maker? Approve only relevant contacts. Never approve sales, marketing, BD, or customer success titles. For small companies, approve the President or CEO if no better match exists. Return a JSON array of indexes (max 3), or [] if none qualify.\n\nJob Description:\n' + description + '\n\nCandidate contacts:\n' + contactList;

  var rankText = await callGemini(validatePrompt);
  var selectedIndexes = parseGeminiJson(rankText);
  if (!Array.isArray(selectedIndexes)) {
    console.log('Gemini selected:', lead.company, '- [] from', people.length, 'candidates');
    return null;
  }
  console.log('Gemini selected:', lead.company, '-', selectedIndexes, 'from', people.length, 'candidates');
  if (!selectedIndexes.length) {
    return null;
  }

  // Step 5: Enrich selected contacts (1 credit each)
  var contacts = [];
  for (var j = 0; j < selectedIndexes.length && contacts.length < 3; j++) {
    var idx = selectedIndexes[j];
    if (idx < 0 || idx >= people.length) continue;

    var person = people[idx];
    var matchBody = {
      id: person.id
    };

    try {
      var matchRes = await fetch('https://api.apollo.io/api/v1/people/match', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.APOLLO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(matchBody)
      });

      if (!matchRes.ok) {
        console.log('Apollo enrich failed for', person.first_name, person.title);
        continue;
      }

      var matchData = await matchRes.json();
      var enriched = matchData.person || matchData;

      // Only store US contacts or contacts with no country
      var country = enriched.country || '';
      if (country && country !== 'United States') continue;

      contacts.push({
        apollo_id: enriched.id || person.id || '',
        first_name: enriched.first_name || '',
        last_name: enriched.last_name || '',
        full_name: ((enriched.first_name || '') + ' ' + (enriched.last_name || '')).trim(),
        name: ((enriched.first_name || '') + ' ' + (enriched.last_name || '')).trim(),
        job_title: enriched.title || '',
        title: enriched.title || '',
        city: toTitleCase(enriched.city || ''),
        state: toTitleCase(enriched.state || ''),
        country: enriched.country || '',
        linkedin: ensureUrl(enriched.linkedin_url || ''),
        photo_url: enriched.photo_url || '',
        email: null,
        emailInferred: false,
        source: 'apollo'
      });

      console.log('Enriched contact:', lead.company, '-', enriched.first_name, enriched.title, '-', enriched.city, enriched.state);
    } catch (e) {
      console.log('Apollo enrich error for', person.first_name, ':', e.message);
    }
  }

  // Step 6: Merge cached contacts (avoid duplicates by apollo_id)
  var apolloIds = {};
  contacts.forEach(function(c) { if (c.apollo_id) apolloIds[c.apollo_id] = true; });
  cachedContacts.forEach(function(c) {
    if (c.apollo_id && !apolloIds[c.apollo_id]) {
      contacts.push(c);
      apolloIds[c.apollo_id] = true;
    }
  });

  // Step 7: Build allContacts from full Apollo search results (free data, no credits)
  var allContacts = [];
  people.forEach(function(p) {
    var pid = p.id || '';
    if (pid && !apolloIds[pid]) {
      allContacts.push({
        apollo_id: pid,
        first_name: p.first_name || '',
        last_name_obfuscated: (p.last_name || '').charAt(0) + '.',
        title: p.title || ''
      });
    }
  });

  // Step 8: Extract company-level data
  var companyData = { apollo_org_id: orgId };

  return contacts.length > 0 ? { contacts: contacts, allContacts: allContacts, companyData: companyData } : null;
}

module.exports = async function handler(req, res) {
  var authHeader = req.headers['authorization'] || '';
  if (authHeader !== 'Bearer ' + process.env.JOBS_CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.APOLLO_API_KEY) return res.status(500).json({ error: 'APOLLO_API_KEY not configured' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  try {
    var MAX_PER_RUN = 3;
    var keys = await redisKeys('lead:*');
    var processed = 0;
    var contactsFound = 0;
    var skipped = 0;

    for (var i = 0; i < keys.length; i++) {
      if (processed >= MAX_PER_RUN) { console.log('Hit max ' + MAX_PER_RUN + ' leads per run, deferring rest'); break; }
      var lead = await redisGet(keys[i]);
      if (!lead) { console.log('Skip ' + keys[i] + ': null lead'); skipped++; continue; }

      if (lead.status !== 'new') { console.log('Skip ' + lead.company + ': status=' + lead.status); skipped++; continue; }

      // Temporary: re-process leads from old Explorium pipeline
      var hasExploriumContacts = lead.contacts && lead.contacts.length > 0 && lead.contacts[0].source === 'explorium';
      var enrichedButEmpty = lead.contactsEnrichedAt && (!lead.contacts || lead.contacts.length === 0);
      var needsReprocess = hasExploriumContacts || enrichedButEmpty;

      if (!needsReprocess) {
        if (lead.contacts && lead.contacts.length > 0) {
          // Backfill company_linkedin on skipped leads that already have contacts
          if (!lead.company_linkedin && lead.company_domain) {
            try {
              var bfRes = await fetch('https://api.apollo.io/api/v1/organizations/enrich?domain=' + encodeURIComponent(lead.company_domain), {
                headers: { 'x-api-key': process.env.APOLLO_API_KEY }
              });
              if (bfRes.ok) {
                var bfData = await bfRes.json();
                var bfLinkedin = bfData.organization && bfData.organization.linkedin_url;
                if (bfLinkedin) {
                  lead.company_linkedin = bfLinkedin;
                  await redisSet(keys[i], lead, 604800);
                  console.log('Backfilled company_linkedin for', lead.company, ':', bfLinkedin);
                }
              }
            } catch (e) { console.log('Backfill error:', e.message); }
          }
          console.log('Skip ' + lead.company + ': already has ' + lead.contacts.length + ' contacts (source=' + lead.contacts[0].source + ')'); skipped++; continue;
        }
        if (lead.contactsEnrichedAt) { console.log('Skip ' + lead.company + ': already enriched at ' + new Date(lead.contactsEnrichedAt).toISOString()); skipped++; continue; }
      } else {
        console.log('Reprocessing ' + lead.company + ': ' + (hasExploriumContacts ? 'explorium contacts' : 'enriched but empty'));
      }

      console.log('Processing contacts for:', lead.company, '-', lead.jobTitle);

      try {
        var result = await processLead(lead, keys[i]);

        if (result && result.contacts && result.contacts.length > 0) {
          lead.contacts = result.contacts;
          lead.allContacts = result.allContacts || [];
          if (result.companyData.apollo_org_id) lead.apollo_org_id = result.companyData.apollo_org_id;
          lead.contactsEnrichedAt = Date.now();
          await redisSet(keys[i], lead, 604800);
          contactsFound += result.contacts.length;
          console.log('Found', result.contacts.length, 'contacts for', lead.company, '+', lead.allContacts.length, 'additional');
        } else {
          lead.contactsEnrichedAt = Date.now();
          lead.contacts = [];
          lead.allContacts = [];
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
