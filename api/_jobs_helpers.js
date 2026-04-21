// api/_jobs_helpers.js
// Shared helpers for the daily jobs-fetch cron (api/jobs-fetch.js) and any
// one-off backfill scripts that need to run the identical filter / classify /
// enrichment pipeline (e.g. scripts/drew-ga-sc-3day-backfill.js).
//
// Nothing here has state; all functions are pure or simple Redis/HTTP wrappers.

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchGemini(body) {
  const res = await fetch(GEMINI_URL + process.env.GOOGLE_API_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res;
}

const EXCLUDE_TITLES = [
  'civil engineer','pe ','professional engineer','architect','architectural',
  'structural engineer','geotechnical','environmental engineer'
];

const PRIMARY_KEYWORDS = [
  'engineer','engineering','accountant','accounting','finance','financial',
  'controller','cfo','cto','it manager','it director','network','software',
  'developer','systems admin','helpdesk','help desk','manufacturing',
  'machinist','production','quality','procurement','supply chain',
];

const TRUSTED_DOMAINS = [
  'indeed.com','linkedin.com','glassdoor.com','ziprecruiter.com','monster.com',
  'careerbuilder.com','simplyhired.com','dice.com','jobvite.com','greenhouse.io',
  'lever.co','workday.com','myworkdayjobs.com','icims.com','taleo.net',
  'smartrecruiters.com','successfactors.com','brassring.com','recruiterbox.com',
  'bamboohr.com','paylocity.com','adp.com',
  'whatjobs.com','digitalhire.com','jobleads.com'
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

async function redisAppend(key, text) {
  const url = `${process.env.KV_REST_API_URL}/append/${encodeURIComponent(key)}/${encodeURIComponent(text)}`;
  await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
}

// --- Load dynamic blocklists from Redis ---
async function loadBlocklists() {
  const companiesRaw = await redisGet('blocklist:companies') || [];
  const titlesRaw = await redisGet('blocklist:titles') || [];
  const toName = e => typeof e === 'string' ? e : (e && e.company) || '';
  const companies = (Array.isArray(companiesRaw) ? companiesRaw : []).map(toName).filter(Boolean);
  const titles = (Array.isArray(titlesRaw) ? titlesRaw : []).map(toName).filter(Boolean);
  return { companies, titles };
}

// --- Normalize company name ---
function normalizeCompany(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(inc|llc|corp|co|ltd|group|enterprises|company|solutions|services|technologies|partners)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// --- Normalize job title for dedup ---
function normalizeTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getRootDomain(domain) {
  if (!domain) return domain;
  const d = domain.replace(/^www\./, '');
  const parts = d.split('.');
  if (parts.length <= 2) return d;
  return parts.slice(-2).join('.');
}

// --- Keyword-based category fallback ---
function detectCategoryKeyword(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  if (/accountant|accounting|controller|cfo|finance|financial|bookkeeper|audit|tax/.test(text)) return 'accounting';
  if (/\bit\b|information technology|network|software|developer|systems admin|helpdesk|help desk|cyber|devops/.test(text)) return 'it';
  if (/\bhr\b|human resources|marketing|administrative|customer service|sales|legal/.test(text)) return 'other';
  return 'engineering';
}

// --- Detect job category via Gemini ---
async function detectCategory(title, description) {
  const VALID_CATEGORIES = ['engineering', 'it', 'accounting', 'other'];
  const prompt = `Classify this job into exactly one category. Return only one word: engineering, it, accounting, or other.

Rules:
- engineering: any manufacturing, production, or industrial role including engineers, technicians, machinists, quality roles, plant operations, automation, CNC, welding, assembly, maintenance, and all other hands-on or supervisory manufacturing roles
- it: software developers, network engineers, systems administrators, cybersecurity, cloud, devops, database, helpdesk, and all other pure technology roles
- accounting: accountants, controllers, CFOs, finance analysts, bookkeepers, auditors, tax, and all other finance/accounting roles
- other: HR, marketing, administrative, customer service, business professional, sales, legal, and any role that does not fit the above three categories

Job title: ${title}
Full job description: ${(description || '').slice(0, 3000)}

Return only one word.`;

  try {
    const res = await fetchGemini({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 10, temperature: 0 },
    });
    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
    if (VALID_CATEGORIES.includes(answer)) {
      console.log(`Gemini category: ${title} - ${answer}`);
      return answer;
    }
    console.log(`Gemini category unexpected value: "${answer}", falling back to keyword logic`);
  } catch (e) {
    console.error('Gemini category error:', e.message);
  }
  const fallback = detectCategoryKeyword(title, description);
  console.log(`Gemini category fallback: ${title} - ${fallback}`);
  return fallback;
}

function hasPrimaryKeyword(title) {
  const t = String(title || '').toLowerCase();
  return PRIMARY_KEYWORDS.some(kw => t.includes(kw));
}

// --- Gemini validation: relevance + staffing/agency detection ---
async function isRelevantViaGemini(title, description) {
  const prompt = `You are a filter for a staffing agency that places candidates in Engineering, Manufacturing, Accounting, Finance, and IT roles in the United States.

Evaluate this job posting and answer only YES or NO: Is this a direct employer job posting that a staffing agency could potentially pitch their services to?

Answer NO only if one of these is clearly true:
- The posting is from a staffing, recruiting, or consulting firm posting on behalf of a client (look for phrases like "we are recruiting for", "our client is looking for", "on behalf of our client", or the company is a known staffing firm)
- The job is located outside the United States
- The role is military, active duty, or direct government employment (city, county, state, or federal government)
- The role itself is completely unrelated to Engineering, Manufacturing, IT, Accounting, or Finance regardless of the employer industry -- for example: clinical healthcare roles (nurses, doctors, therapists), customer-facing retail roles (cashiers, store associates), food service roles (servers, cooks, kitchen staff), teaching, legal practice, real estate agents

Answer YES if the role function could reasonably fall under Engineering, Manufacturing, IT, Accounting, Finance, or related business operations -- regardless of what industry the employer is in. A Controller at a hospital, an IT Manager at a retailer, or an Engineer at a food company should all be YES. When in doubt, answer YES.

Job title: ${title}
Job description: ${(description || 'Not available').slice(0, 5000)}

Answer only YES or NO.`;

  try {
    const res = await fetchGemini({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 5, temperature: 0.1 },
    });
    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
    console.log(`Gemini filter "${title}": ${answer}`);
    if (!answer) {
      console.log(`Gemini empty response for "${title}", defaulting to pass-through`);
      return { relevant: true, response: 'EMPTY_PASSTHROUGH' };
    }
    if (answer === 'NO') return { relevant: false, response: 'NO' };
    return { relevant: true, response: answer };
  } catch (e) {
    console.error('Gemini filter error:', e.message);
    return { relevant: true, response: 'ERROR_PASSTHROUGH: ' + e.message };
  }
}

function isAggregatorSource(applyLink, employerName) {
  if (!applyLink) return false;
  try {
    const hostname = new URL(applyLink).hostname.toLowerCase();
    const words = String(employerName || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    for (const word of words) {
      if (word.length >= 5 && hostname.includes(word)) return false;
    }
    for (const domain of TRUSTED_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) return false;
    }
    return hostname;
  } catch (e) {
    return false;
  }
}

function isJobBoard(employerName) {
  const name = String(employerName || '').toLowerCase();
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

function isExcludedTitle(title, dynamicTitles) {
  const t = String(title || '').toLowerCase();
  const allExclusions = [...EXCLUDE_TITLES, ...(dynamicTitles || []).map(x => String(x).toLowerCase())];
  return allExclusions.some(ex => t.includes(ex));
}

function isBlockedCompany(employerName, dynamicCompanies) {
  const normalized = normalizeCompany(employerName);
  return (dynamicCompanies || []).map(c => normalizeCompany(c)).some(c =>
    c && (normalized.includes(c) || c.includes(normalized))
  );
}

// Pre-Gemini employer keyword hit — staffing / recruiting / gov-edu.
function hasStaffingOrGovHit(employerName) {
  const empLower = String(employerName || '').toLowerCase();
  const staffingHit = ['staffing','recruiting','recruitment','search partners','placement','via dice','robert half','virtual vocations','ilocatum','executiveplacements','jobot','akkodis','search & delivery','employment partners','vetjobs','vet jobs'].some(k => empLower.includes(k));
  const govEduHit = ['public schools','school district','township','department of'].some(k => empLower.includes(k)) || ['city of','county of','state of'].some(k => empLower.startsWith(k));
  return staffingHit || govEduHit;
}

// --- Fetch one page from JSearch (unified, configurable) ---
async function fetchJSearchPage(query, opts = {}) {
  const params = new URLSearchParams({
    query,
    page: String(opts.page || 1),
    num_pages: String(opts.numPages || 5),
    date_posted: opts.datePosted || 'today',
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

// Infer a company website domain via Gemini when the JSearch payload doesn't
// carry employer_website. Returns the normalized domain string or null.
async function inferCompanyDomain(employer, locationStr) {
  try {
    const domainPrompt = `What is the primary website domain for this company?\n\nCompany name: ${employer}\nLocation: ${locationStr}\n\nReturn only the domain (e.g. acmecorp.com) with no explanation, no punctuation, no http or www prefix. Return the single word null if you are not confident.`;
    const domainRes = await fetchGemini({
      contents: [{ parts: [{ text: domainPrompt }] }],
      generationConfig: { maxOutputTokens: 30, temperature: 0 },
    });
    const domainData = await domainRes.json();
    const domainAnswer = (domainData.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().toLowerCase();
    console.log(`Gemini domain inference: ${employer} -> ${domainAnswer}`);
    if (domainAnswer && domainAnswer !== 'null' && domainAnswer.includes('.')) return domainAnswer;
    await redisAppend('domain_inference_log', `${employer}, ${locationStr}\n`);
    return null;
  } catch (e) {
    console.error('Gemini domain inference error:', e.message);
    await redisAppend('domain_inference_log', `${employer}, ${locationStr}\n`);
    return null;
  }
}

module.exports = {
  // misc
  sleep,
  GEMINI_URL,
  // constants
  EXCLUDE_TITLES,
  PRIMARY_KEYWORDS,
  TRUSTED_DOMAINS,
  // redis
  redisGet,
  redisSet,
  redisKeys,
  redisAppend,
  // blocklists
  loadBlocklists,
  // classify / normalize
  normalizeCompany,
  normalizeTitle,
  getRootDomain,
  detectCategoryKeyword,
  detectCategory,
  hasPrimaryKeyword,
  // filters
  isRelevantViaGemini,
  isAggregatorSource,
  isJobBoard,
  isContractRole,
  isExcludedTitle,
  isBlockedCompany,
  hasStaffingOrGovHit,
  // external fetches
  fetchGemini,
  fetchJSearchPage,
  inferCompanyDomain,
};
