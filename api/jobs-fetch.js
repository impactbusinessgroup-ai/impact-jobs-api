// api/jobs-fetch.js

const STAFFING_KEYWORDS = [
  // staffing / recruiting firms only
  'staffing','recruiting','recruiter','placement','personnel',
  'manpower','adecco','robert half','kelly services','randstad',
  'insight global','aerotek','apex systems','teksystems',
  'express employment','search group','headhunter',
  'exec search','executive search','ajilon','modis','experis',
  'pontoon','allegis','creative financial staffing','orion talent',
  'actalent','interim staffing','kforce','spherion','volt ',
  'staffmark','on assignment','hired','hirequest',
  // military branches
  'us navy','us army','us air force','us marine','us coast guard',
  'national guard',
];

const AGENCY_PHRASES = [
  'our client','on behalf of our client','confidential client',
  'we are recruiting','we are seeking on behalf','our client is seeking',
  'representing a client','placed with our client'
];

const EXCLUDE_TITLES = [
  'civil engineer','pe ','professional engineer','architect','architectural',
  'structural engineer','geotechnical','environmental engineer'
];

const JSEARCH_QUERIES = [
  'engineer Grand Rapids Michigan',
  'accounting Grand Rapids Michigan',
  'information technology Grand Rapids Michigan',
  'engineer Tampa Florida',
  'accounting Tampa Florida',
  'information technology Tampa Florida',
];

const PRIMARY_KEYWORDS = [
  'engineer','engineering','accountant','accounting','finance','financial',
  'controller','cfo','cto','it manager','it director','network','software',
  'developer','systems admin','helpdesk','help desk','manufacturing',
  'machinist','production','quality','procurement','supply chain',
];

// --- Upstash Redis helpers ---
async function redisGet(key) {
  const url = `${process.env.KV_REST_API_URL}/get/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  const data = await res.json();
  if (!data.result) return null;
  try {
    let value = data.result;
    while (typeof value === 'string') value = JSON.parse(value);
    if (value && typeof value.value === 'string') value = JSON.parse(value.value);
    return value;
  } catch (e) {
    return null;
  }
}

async function redisSet(key, value, exSeconds) {
  const url = `${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}`;
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value: JSON.stringify(value), ex: exSeconds }),
  });
}

async function redisKeys(pattern) {
  const url = `${process.env.KV_REST_API_URL}/keys/${encodeURIComponent(pattern)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  const data = await res.json();
  return data.result || [];
}

// --- Load dynamic blocklists from Redis ---
async function loadBlocklists() {
  const companies = await redisGet('blocklist:companies') || [];
  const titles = await redisGet('blocklist:titles') || [];
  return { companies, titles };
}

// --- Normalize company name ---
function normalizeCompany(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(inc|llc|corp|co|ltd|group|enterprises|company|solutions|services|technologies|partners)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// --- Detect job category ---
function detectCategory(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  if (/accountant|accounting|controller|cfo|finance|financial|bookkeeper|audit|tax/.test(text)) return 'accounting';
  if (/\bit\b|information technology|network|software|developer|systems admin|helpdesk|help desk|cyber|devops/.test(text)) return 'it';
  return 'engineering';
}

// --- Check if title contains a primary keyword ---
function hasPrimaryKeyword(title) {
  const t = title.toLowerCase();
  return PRIMARY_KEYWORDS.some(kw => t.includes(kw));
}

// --- Gemini classification for ambiguous titles ---
async function isRelevantViaGemini(title, description) {
  const prompt = `You are a filter for a staffing agency that places candidates in Engineering, Manufacturing, Accounting, Finance, and IT roles in the United States.

Based on this job posting, would this company potentially need a staffing partner to fill this type of role?

Job title: ${title}
Job description: ${description || 'Not available'}

Answer only YES or NO.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 5, temperature: 0 },
        }),
      }
    );
    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
    console.log(`Gemini classified "${title}": ${answer}`);
    return answer === 'YES';
  } catch (e) {
    console.error('Gemini classification error:', e.message);
    return true;
  }
}

// --- Filter checks ---
function isStaffingCompany(employerName) {
  const name = employerName.toLowerCase();
  return STAFFING_KEYWORDS.some(kw => name.includes(kw));
}

function isJobBoard(employerName) {
  const name = employerName.toLowerCase();
  const patterns = [
    'jobline','virtualvocation','whatjobs','jobleads','jobboard',
    'careers page','simplyhired','jobvite',
    'entry level technology jobs','entry-level-technology',
  ];
  return patterns.some(p => name.includes(p));
}

function isContractRole(job) {
  const type = (job.job_employment_type || '').toLowerCase();
  const types = (job.job_employment_types || []).map(t => t.toLowerCase());
  const allTypes = [type, ...types].join(' ');
  return /contractor|contract to hire|contract-to-hire|temp to hire|temp-to-hire|temporary/.test(allTypes);
}

function isAgencyPosting(description) {
  if (!description) return false;
  const text = description.toLowerCase();
  return AGENCY_PHRASES.some(phrase => text.includes(phrase));
}

function isExcludedTitle(title, dynamicTitles) {
  const t = title.toLowerCase();
  const allExclusions = [...EXCLUDE_TITLES, ...dynamicTitles.map(t => t.toLowerCase())];
  return allExclusions.some(ex => t.includes(ex));
}

function isBlockedCompany(employerName, dynamicCompanies) {
  const normalized = normalizeCompany(employerName);
  return dynamicCompanies.map(c => normalizeCompany(c)).some(c =>
    normalized.includes(c) || c.includes(normalized)
  );
}

// --- Fetch one page from JSearch ---
async function fetchJSearchPage(query, page = 1) {
  const params = new URLSearchParams({
    query,
    page: String(page),
    num_pages: '1',
    date_posted: 'today',
    country: 'us',
    radius: '50',
  });
  const url = `https://jsearch.p.rapidapi.com/search?${params}`;
  const res = await fetch(url, {
    headers: {
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      'x-rapidapi-key': process.env.JSEARCH_API_KEY,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    console.error(`JSearch error for "${query}": ${res.status}`);
    return [];
  }
  const data = await res.json();
  return data.data || [];
}

// --- Main handler ---
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.headers['authorization'] !== 'Bearer test123') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date().toISOString().split('T')[0];
  const seenCompanies = new Set();
  const qualifiedLeads = [];
  let totalFetched = 0;
  let totalFiltered = 0;
  let geminiCalls = 0;

  const { companies: blockedCompanies, titles: blockedTitles } = await loadBlocklists();
  console.log(`Blocklists: ${blockedCompanies.length} companies, ${blockedTitles.length} titles`);

  const existingKeys = await redisKeys(`lead:${today}:*`);
  for (const key of existingKeys) {
    const lead = await redisGet(key);
    if (lead?.normalizedCompany) seenCompanies.add(lead.normalizedCompany);
  }

  for (const query of JSEARCH_QUERIES) {
    console.log(`Fetching: ${query}`);
    const jobs = await fetchJSearchPage(query);
    console.log(`Got ${jobs.length} jobs for: ${query}`);
    totalFetched += jobs.length;

    for (const job of jobs) {
      const title = job.job_title || '';
      const employer = job.employer_name || '';
      const description = job.job_description || '';

      if (isExcludedTitle(title, blockedTitles)) { totalFiltered++; continue; }
      if (isStaffingCompany(employer)) { totalFiltered++; continue; }
      if (isJobBoard(employer)) { totalFiltered++; continue; }
      if (isContractRole(job)) { totalFiltered++; continue; }
      if (isAgencyPosting(description)) { totalFiltered++; continue; }
      if (isBlockedCompany(employer, blockedCompanies)) { totalFiltered++; continue; }

      let isRelevant = hasPrimaryKeyword(title);
      if (!isRelevant) {
        geminiCalls++;
        isRelevant = await isRelevantViaGemini(title, description);
      }
      if (!isRelevant) { totalFiltered++; continue; }

      const normalized = normalizeCompany(employer);
      if (seenCompanies.has(normalized)) { totalFiltered++; continue; }
      seenCompanies.add(normalized);

      const category = detectCategory(title, description);
      const leadId = `lead:${today}:${normalized.replace(/\s/g, '-').slice(0, 50)}`;

      const lead = {
        id: leadId,
        date: today,
        jobTitle: title,
        company: employer,
        normalizedCompany: normalized,
        location: `${job.job_city || ''}, ${job.job_state || ''}`.trim().replace(/^,\s*/, ''),
        description: description.slice(0, 2000),
        source: 'jsearch',
        jobUrl: job.job_apply_link || '',
        category,
        status: 'new',
        contacts: [],
        createdAt: Date.now(),
      };

      await redisSet(leadId, lead, 60 * 60 * 24 * 7);
      qualifiedLeads.push(leadId);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`Done: ${totalFetched} fetched, ${totalFiltered} filtered, ${qualifiedLeads.length} qualified, ${geminiCalls} Gemini calls`);

  return res.status(200).json({
    ok: true,
    date: today,
    fetched: totalFetched,
    filtered: totalFiltered,
    qualified: qualifiedLeads.length,
    geminiCalls,
    leadIds: qualifiedLeads,
  });
};
