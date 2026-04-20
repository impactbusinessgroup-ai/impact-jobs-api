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
  var res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + process.env.GOOGLE_API_KEY,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens || 400, temperature: 0.2 }
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

function extractState(location) {
  if (!location) return '';
  var parts = location.split(',');
  return (parts[1] || '').trim();
}

function getDefaultTitles() {
  return ['Director', 'VP', 'Manager', 'President', 'General Manager'];
}

function getRootDomain(domain) {
  if (!domain) return domain;
  // Strip www
  var d = domain.replace(/^www\./, '');
  // Extract root domain (last two parts, or last three if TLD is two-part like co.uk)
  var parts = d.split('.');
  if (parts.length <= 2) return d;
  // Keep last 2 parts as root domain
  return parts.slice(-2).join('.');
}

async function processLead(lead, leadKey, debugLog) {
  var dbg = { company: lead.company, domain: lead.company_domain || '', timestamp: new Date().toISOString() };
  var rawDomain = lead.company_domain || '';
  if (!rawDomain) {
    dbg.result = 'skip_no_domain';
    debugLog.push(dbg);
    console.log('Skip ' + lead.company + ': no domain');
    return null;
  }

  // Strip subdomains to get root domain
  var domain = getRootDomain(rawDomain);
  if (domain !== rawDomain) {
    console.log('Stripped subdomain:', rawDomain, '->', domain);
    lead.company_domain = domain;
    await redisSet(leadKey, lead, 1209600);
  }
  dbg.domain = domain;

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

    var org = {};
    if (orgRes.ok) {
      var orgData = await orgRes.json();
      org = orgData.organization || {};
      orgId = org.id;
    }

    // Validate org name matches lead company name
    if (orgId && org.name) {
      var _stripSuffixes = function(n) {
        return n.replace(/\b(Inc|LLC|Corp|Corporation|Ltd|Co|Group|Services|Solutions|Partners|Associates|Industries|International|Global|Technologies|Systems|Enterprises|Holdings)\b\.?/gi, '').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
      };
      var cleanOrg = _stripSuffixes(org.name);
      var cleanLead = _stripSuffixes(lead.company);
      var orgContainsLead = cleanOrg.indexOf(cleanLead) !== -1;
      var leadContainsOrg = cleanLead.indexOf(cleanOrg) !== -1;
      if (!orgContainsLead && !leadContainsOrg) {
        var orgWords = cleanOrg.split(' ').filter(function(w){return w.length>1;});
        var leadWords = cleanLead.split(' ').filter(function(w){return w.length>1;});
        var overlap = 0;
        for (var wi = 0; wi < leadWords.length; wi++) {
          if (orgWords.indexOf(leadWords[wi]) !== -1) overlap++;
        }
        var maxWords = Math.max(leadWords.length, 1);
        var similarity = overlap / maxWords;
        if (similarity < 0.6) {
          console.log('Org name mismatch for', lead.company, ': Apollo returned "' + org.name + '" (similarity: ' + Math.round(similarity * 100) + '%)');
          dbg.org_name_mismatch = { lead_name: lead.company, apollo_name: org.name, similarity: Math.round(similarity * 100) };
          orgId = null;
          org = {};
        }
      }
    }

    // Fallback 2: search by company name if domain enrichment failed
    if (!orgId) {
      console.log('Org enrichment failed for', lead.company, '(' + domain + '), trying company name search');
      dbg.org_enrichment = 'domain_failed';
      try {
        var locState = extractState(lead.location);
        var nameSearchBody = { q_organization_name: lead.company, per_page: 5 };
        if (locState) nameSearchBody.organization_locations = [locState];
        console.log('Company name search:', lead.company, '| location filter:', locState || '(none)');
        var nameSearchRes = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
          method: 'POST',
          headers: {
            'x-api-key': process.env.APOLLO_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(nameSearchBody)
        });
        var nameData = nameSearchRes.ok ? await nameSearchRes.json() : {};
        var orgs = nameData.organizations || nameData.accounts || [];
        // Retry without location if no results
        if (!orgs.length && locState) {
          console.log('Company name search retry without location for', lead.company);
          var nameSearchRes2 = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
            method: 'POST',
            headers: {
              'x-api-key': process.env.APOLLO_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q_organization_name: lead.company, per_page: 5 })
          });
          if (nameSearchRes2.ok) {
            var nameData2 = await nameSearchRes2.json();
            orgs = nameData2.organizations || nameData2.accounts || [];
          }
        }
        if (orgs.length > 0) {
          var match = orgs[0];
          orgId = match.id;
          org = match;
          dbg.org_search_fallback = true;
          dbg.org_search_match = match.name || '';
          console.log('Company name search found:', match.name, '| org_id:', orgId);
        } else {
          console.log('Company name search returned 0 results for', lead.company);
        }
      } catch (e) {
        console.log('Company name search error:', e.message);
      }
    }

    if (!orgId) {
      dbg.org_enrichment = dbg.org_enrichment || 'fail_no_org_id';
      dbg.result = 'skip_no_org_id';
      debugLog.push(dbg);
      console.log('Skip ' + lead.company + ': no org ID after all fallbacks');
      return null;
    }
    if (!dbg.org_search_fallback) dbg.org_enrichment = 'success';
    dbg.org_id = orgId;

    // Store org ID, location metadata, and company LinkedIn on lead
    lead.apollo_org_id = orgId;
    lead.apollo_num_locations = org.num_locations || null;
    lead.apollo_hq_city = org.city || '';
    lead.apollo_hq_state = org.state || '';
    lead.apollo_estimated_employees = org.estimated_num_employees || null;
    var orgLinkedin = org.linkedin_url;
    if (orgLinkedin) lead.company_linkedin = orgLinkedin;
    await redisSet(leadKey, lead, 1209600);
    console.log('Apollo org ID for', lead.company, ':', orgId, '| locations:', org.num_locations, '| HQ:', org.city, org.state);
  } else {
    dbg.org_enrichment = 'cached';
    dbg.org_id = orgId;
    console.log('Using cached org ID for', lead.company, ':', orgId);
    // Fetch org data if location metadata missing
    if (!lead.apollo_num_locations || !lead.company_linkedin) {
      try {
        var orgRes2 = await fetch('https://api.apollo.io/api/v1/organizations/enrich?domain=' + encodeURIComponent(domain), {
          headers: { 'x-api-key': process.env.APOLLO_API_KEY }
        });
        if (orgRes2.ok) {
          var orgData2 = await orgRes2.json();
          var org2 = orgData2.organization || {};
          if (!lead.apollo_num_locations) {
            lead.apollo_num_locations = org2.num_locations || null;
            lead.apollo_hq_city = org2.city || '';
            lead.apollo_hq_state = org2.state || '';
            lead.apollo_estimated_employees = org2.estimated_num_employees || null;
          }
          if (!lead.company_linkedin && org2.linkedin_url) {
            lead.company_linkedin = org2.linkedin_url;
          }
          await redisSet(leadKey, lead, 1209600);
          console.log('Backfilled org metadata for', lead.company, '| locations:', lead.apollo_num_locations, '| HQ:', lead.apollo_hq_city, lead.apollo_hq_state);
        }
      } catch (e) {
        console.log('Org metadata backfill error:', e.message);
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

  // Step 3: Apollo people search (free) with location strategy
  var jobState = extractState(lead.location);
  var numLocations = lead.apollo_num_locations || 1;
  var hqState = (lead.apollo_hq_state || '').toLowerCase();
  var targetStates = ['michigan', 'florida'];
  var hqInTarget = targetStates.indexOf(hqState) !== -1;

  var searchBody = {
    organization_ids: [orgId],
    person_titles: personTitles,
    per_page: 10
  };

  var locationStrategy;
  if (numLocations === 1) {
    // Single location: no location filter
    locationStrategy = 'single_location_no_filter';
  } else if (hqInTarget) {
    // Multi-location, HQ in MI/FL: filter by job state
    locationStrategy = 'multi_hq_in_target';
    if (jobState) searchBody.person_locations = [jobState + ', United States'];
  } else {
    // Multi-location, HQ outside MI/FL: try with filter first
    locationStrategy = 'multi_hq_outside_target';
    if (jobState) searchBody.person_locations = [jobState + ', United States'];
  }

  dbg.location_strategy = locationStrategy;
  dbg.num_locations = numLocations;
  dbg.hq_state = lead.apollo_hq_state || '';
  console.log('Apollo location strategy:', lead.company, '-', locationStrategy, '| numLocations:', numLocations, '| HQ state:', lead.apollo_hq_state || '(unknown)', '| filter:', searchBody.person_locations || '(none)');

  var apolloRes = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.APOLLO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(searchBody)
  });

  if (!apolloRes.ok) {
    dbg.apollo_people = 'http_error_' + apolloRes.status;
    dbg.result = 'skip_apollo_http_error';
    debugLog.push(dbg);
    console.log('No Apollo people found for', lead.company);
    return null;
  }

  var apolloData = await apolloRes.json();
  var people = apolloData.people || [];
  var total = (apolloData.pagination && apolloData.pagination.total_entries != null) ? apolloData.pagination.total_entries : people.length;
  dbg.apollo_people_count = people.length;
  dbg.apollo_people_total = total;
  dbg.apollo_search_titles = searchBody.person_titles;
  dbg.apollo_search_location = searchBody.person_locations || null;
  console.log('Apollo search result:', lead.company, '-', total, 'people found');

  // Retry without location filter for multi-location HQ-outside-target companies
  if (!people.length && locationStrategy === 'multi_hq_outside_target' && searchBody.person_locations) {
    console.log('Retrying without location filter for', lead.company);
    delete searchBody.person_locations;
    dbg.location_retry = true;

    var retryRes = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.APOLLO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchBody)
    });

    if (retryRes.ok) {
      var retryData = await retryRes.json();
      people = retryData.people || [];
      total = (retryData.pagination && retryData.pagination.total_entries != null) ? retryData.pagination.total_entries : people.length;
      dbg.apollo_retry_people_count = people.length;
      dbg.apollo_retry_people_total = total;
      console.log('Apollo retry result:', lead.company, '-', total, 'people found (no location filter)');
    }
  }

  // Retry with broad default titles if Gemini's specific titles returned 0
  if (!people.length) {
    var broadTitles = ['President', 'CEO', 'Owner', 'COO', 'Operations Manager', 'General Manager', 'Plant Manager', 'HR Manager', 'Talent Acquisition', 'Recruiter', 'Director', 'VP', 'Vice President', 'Manager'];
    var broadBody = { organization_ids: [orgId], person_titles: broadTitles, per_page: 10 };
    dbg.broad_title_retry = true;
    console.log('Retrying with broad titles for', lead.company);

    var broadRes = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.APOLLO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(broadBody)
    });

    if (broadRes.ok) {
      var broadData = await broadRes.json();
      people = broadData.people || [];
      total = (broadData.pagination && broadData.pagination.total_entries != null) ? broadData.pagination.total_entries : people.length;
      dbg.broad_retry_people_count = people.length;
      dbg.broad_retry_people_total = total;
      console.log('Apollo broad retry result:', lead.company, '-', total, 'people found');
    }
  }

  if (!people.length) {
    dbg.result = 'skip_no_people';
    debugLog.push(dbg);
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
  var usedFallback = false;
  if (!Array.isArray(selectedIndexes) || !selectedIndexes.length) {
    console.log('Gemini selected:', lead.company, '- empty/null from', people.length, 'candidates, using seniority fallback');
    // Fallback: rank by seniority and take top 3
    var seniorityOrder = ['president','ceo','vp','vice president','director','senior manager','manager'];
    var ranked = people.map(function(p, idx) {
      var t = (p.title || '').toLowerCase();
      var rank = seniorityOrder.length;
      for (var s = 0; s < seniorityOrder.length; s++) {
        if (t.indexOf(seniorityOrder[s]) !== -1) { rank = s; break; }
      }
      return { idx: idx, rank: rank };
    }).sort(function(a, b) { return a.rank - b.rank; });
    selectedIndexes = ranked.slice(0, 3).map(function(r) { return r.idx; });
    usedFallback = true;
    dbg.gemini_validation = 'seniority_fallback';
    dbg.gemini_selected_count = selectedIndexes.length;
    dbg.gemini_selected_indexes = selectedIndexes;
    console.log('Fallback selected:', lead.company, '-', selectedIndexes, 'from', people.length, 'candidates');
  } else {
    dbg.gemini_validation = 'gemini_selected';
    dbg.gemini_selected_count = selectedIndexes.length;
    dbg.gemini_selected_indexes = selectedIndexes;
    console.log('Gemini selected:', lead.company, '-', selectedIndexes, 'from', people.length, 'candidates');
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
        title: p.title || '',
        photo_url: p.photo_url || '',
        linkedin_url: p.linkedin_url || '',
        has_city: !!p.city,
        has_state: !!p.state
      });
    }
  });

  // Step 8: Extract company-level data
  var companyData = { apollo_org_id: orgId };

  dbg.enriched_contacts_count = contacts.length;
  dbg.all_contacts_count = allContacts.length;
  dbg.enriched_names = contacts.map(function(c) { return c.full_name + ' - ' + c.title; });
  dbg.result = contacts.length > 0 ? 'success' : 'no_contacts_after_enrich';
  debugLog.push(dbg);

  return contacts.length > 0 ? { contacts: contacts, allContacts: allContacts, companyData: companyData, usedFallback: usedFallback } : null;
}

module.exports = async function handler(req, res) {
  var authHeader = req.headers['authorization'] || '';
  if (authHeader !== 'Bearer ' + process.env.JOBS_CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.APOLLO_API_KEY) return res.status(500).json({ error: 'APOLLO_API_KEY not configured' });
  if (!process.env.GOOGLE_API_KEY) return res.status(500).json({ error: 'GOOGLE_API_KEY not configured' });

  try {
    var MAX_PER_RUN = 3;
    var keys = await redisKeys('lead:*');
    // Sort keys descending so newest dates are processed first
    keys.sort(function(a, b) { return b.localeCompare(a); });
    var processed = 0;
    var contactsFound = 0;
    var skipped = 0;
    var debugLog = (await redisGet('contacts_fetch_debug')) || [];

    for (var i = 0; i < keys.length; i++) {
      if (processed >= MAX_PER_RUN) { console.log('Hit max ' + MAX_PER_RUN + ' leads per run, deferring rest'); break; }
      var lead = await redisGet(keys[i]);
      if (!lead) { console.log('Skip ' + keys[i] + ': null lead'); skipped++; continue; }

      if (lead.status !== 'new') { console.log('Skip ' + lead.company + ': status=' + lead.status); skipped++; continue; }

      // Temporary: re-process leads from old Explorium pipeline
      var hasExploriumContacts = lead.contacts && lead.contacts.length > 0 && lead.contacts[0].source === 'explorium';
      var needsReprocess = hasExploriumContacts;

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
                  await redisSet(keys[i], lead, 1209600);
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
        var result = await processLead(lead, keys[i], debugLog);

        if (result && result.contacts && result.contacts.length > 0) {
          lead.contacts = result.contacts;
          lead.allContacts = result.allContacts || [];
          if (result.companyData.apollo_org_id) lead.apollo_org_id = result.companyData.apollo_org_id;
          if (result.usedFallback) lead.contactSelectionMethod = 'seniority-fallback';
          lead.contactsEnrichedAt = Date.now();
          await redisSet(keys[i], lead, 1209600);
          contactsFound += result.contacts.length;
          console.log('Found', result.contacts.length, 'contacts for', lead.company, (result.usedFallback ? '(seniority fallback)' : ''), '+', lead.allContacts.length, 'additional');
        } else {
          lead.contactsEnrichedAt = Date.now();
          lead.contacts = [];
          lead.allContacts = [];
          await redisSet(keys[i], lead, 1209600);
          console.log('No contacts found for', lead.company);
        }

        processed++;
      } catch (e) {
        console.error('Error processing lead', lead.company, ':', e.message);
        skipped++;
      }

      if (i < keys.length - 1) await delay(500);
    }

    await redisSet('contacts_fetch_debug', debugLog, 86400);
    return res.status(200).json({ ok: true, processed: processed, contactsFound: contactsFound, skipped: skipped });
  } catch (e) {
    console.error('Contacts fetch error:', e.message);
    return res.status(500).json({ error: 'Contacts fetch failed: ' + e.message });
  }
};
