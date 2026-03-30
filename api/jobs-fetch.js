// api/jobs-fetch.js
// Called daily by cron-job.org
// Fetches jobs from JSearch, filters out agencies, stores qualified leads in Redis

const STAFFING_KEYWORDS = [
  'staffing','recruiting','recruiter','talent','placement','personnel',
  'manpower','adecco','robert half','kelly','randstad','insight global',
  'aerotek','apex','teksystems','express employment','search group',
  'headhunter','exec search','executive search'
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
  'engineer Tampa Florida',
  'accounting Tampa Florida',
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

// --- Normalize company name for deduplication ---
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
  const text = (title + ' ' + description).toLowerCase();
  if (/accountant|accounting|controller|cfo|finance|financial|bookkeeper|audit|tax/.test(text)) return 'accounting';
  return 'engineering';
}

// --- Filter checks ---
function isStaffingCompany(employerName) {
  const name = employerName.toLowerCase();
  return STAFFING_KEYWORDS.some(kw => name.includes(kw));
}

function isAgencyPosting(description) {
  const text = description.toLowerCase();
  return AGENCY_PHRASES.some(phrase => text.includes(phrase));
}

function isExcludedTitle(title) {
  const t = title.toLowerCase();
  return EXCLUDE_TITLES.some(ex => t.includes(ex));
}

function hasEngineerOrAccounting(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  return /engineer|engineering|accountant|accounting/.test(text);
}

// --- Fetch one page from JSearch ---
async function fetchJSearchPage(query, page = 1) {
  const params = new URLSearchParams({
    query,
    page: String(page),
    num_pages: '1',
    date_posted: '3days',
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

  console.log('JOBS_CRON_SECRET present:', !!process.env.JOBS_CRON_SECRET);
  console.log('JSEARCH_API_KEY present:', !!process.env.JSEARCH_API_KEY);

  const today = new Date().toISOString().split('T')[0];
  const seenCompanies = new Set();
  const qualifiedLeads = [];
  let totalFetched = 0;
  let totalFiltered = 0;

  // Load companies already seen today
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

      if (!hasEngineerOrAccounting(title, description)) { totalFiltered++; continue; }
      if (isExcludedTitle(title)) { totalFiltered++; continue; }
      if (isStaffingCompany(employer)) { totalFiltered++; continue; }
      if (isAgencyPosting(description)) { totalFiltered++; continue; }

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

  console.log(`Done: ${totalFetched} fetched, ${totalFiltered} filtered, ${qualifiedLeads.length} qualified`);

  return res.status(200).json({
    ok: true,
    date: today,
    fetched: totalFetched,
    filtered: totalFiltered,
    qualified: qualifiedLeads.length,
    leadIds: qualifiedLeads,
  });
};
