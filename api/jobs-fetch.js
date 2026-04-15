// api/jobs-fetch.js

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

const JSEARCH_QUERIES = [
  'engineer Grand Rapids Michigan',
  'accounting Grand Rapids Michigan',
  'information technology Grand Rapids Michigan',
  'engineer Muskegon Michigan',
  'engineer Holland Michigan',
  'engineer Zeeland Michigan',
  'engineer Rockford Michigan',
  'engineer Tampa Florida',
  'accounting Tampa Florida',
  'information technology Tampa Florida',
  'engineer St. Petersburg Florida',
  'engineer Clearwater Florida',
  'accounting St. Petersburg Florida',
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

async function redisSetNoTTL(key, value) {
  const url = `${process.env.KV_REST_API_URL}/set/${encodeURIComponent(key)}`;
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });
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

// --- Check if title contains a primary keyword ---
function hasPrimaryKeyword(title) {
  const t = title.toLowerCase();
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
    if (answer === 'NO') {
      return { relevant: false, response: 'NO' };
    }
    return { relevant: true, response: answer };
  } catch (e) {
    console.error('Gemini filter error:', e.message);
    return { relevant: true, response: 'ERROR_PASSTHROUGH: ' + e.message };
  }
}

const TRUSTED_DOMAINS = [
  'indeed.com','linkedin.com','glassdoor.com','ziprecruiter.com','monster.com',
  'careerbuilder.com','simplyhired.com','dice.com','jobvite.com','greenhouse.io',
  'lever.co','workday.com','myworkdayjobs.com','icims.com','taleo.net',
  'smartrecruiters.com','successfactors.com','brassring.com','recruiterbox.com',
  'bamboohr.com','paylocity.com','adp.com',
  'whatjobs.com','digitalhire.com','jobleads.com'
];

function isAggregatorSource(applyLink, employerName) {
  if (!applyLink) return false;
  try {
    const hostname = new URL(applyLink).hostname.toLowerCase();
    // Check if hostname contains any employer name word 5+ chars
    const words = employerName.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    for (const word of words) {
      if (word.length >= 5 && hostname.includes(word)) return false;
    }
    // Check trusted domains
    for (const domain of TRUSTED_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) return false;
    }
    return hostname;
  } catch (e) {
    return false;
  }
}

// --- Filter checks ---
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
    num_pages: '3',
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

// --- Fetch one page from JSearch (dry run variant with configurable date_posted) ---
async function fetchJSearchPageDryRun(query, datePosted) {
  const params = new URLSearchParams({
    query,
    page: '1',
    num_pages: '1',
    date_posted: datePosted,
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

// --- Dry run handler ---
async function handleDryRun(req, res) {
  const seenCompanies = new Set();
  let totalFetched = 0;
  let afterAggregatorFilter = 0;
  let afterGeminiRelevance = 0;
  let afterBlocklist = 0;
  let afterCategoryDetection = 0;
  const qualifyingJobs = [];
  const aggregatorRejections = [];

  const { companies: blockedCompanies, titles: blockedTitles } = await loadBlocklists();

  for (const query of JSEARCH_QUERIES) {
    console.log(`[dry-run] Fetching: ${query}`);
    const jobs = await fetchJSearchPageDryRun(query, '3days');
    console.log(`[dry-run] Got ${jobs.length} jobs for: ${query}`);
    totalFetched += jobs.length;

    for (const job of jobs) {
      const title = job.job_title || '';
      const employer = job.employer_name || '';
      const description = job.job_description || '';

      // Aggregator filter
      const aggregatorHost = isAggregatorSource(job.job_apply_link, employer);
      if (aggregatorHost) {
        aggregatorRejections.push({ company: employer, jobTitle: title, rejectedDomain: aggregatorHost });
        continue;
      }
      if (isExcludedTitle(title, blockedTitles)) continue;
      if (isJobBoard(employer)) continue;
      if (isContractRole(job)) continue;
      if (!hasPrimaryKeyword(title)) continue;
      afterAggregatorFilter++;

      // Gemini relevance check
      await sleep(250);
      const geminiResult = await isRelevantViaGemini(title, description);
      if (!geminiResult.relevant) continue;
      afterGeminiRelevance++;

      // Blocklist check
      if (isBlockedCompany(employer, blockedCompanies)) continue;
      const normalized = normalizeCompany(employer);
      if (seenCompanies.has(normalized)) continue;
      seenCompanies.add(normalized);
      afterBlocklist++;

      // Category detection
      const category = await detectCategory(title, description);
      afterCategoryDetection++;

      qualifyingJobs.push({
        jobTitle: title,
        company: employer,
        location: `${job.job_city || ''}, ${job.job_state || ''}`.trim().replace(/^,\s*/, ''),
        category,
        sourceUrl: job.job_apply_link || '',
      });
    }

    await new Promise(r => setTimeout(r, 300));
  }

  return res.status(200).json({
    dryRun: true,
    summary: {
      totalFetchedFromJSearch: totalFetched,
      afterAggregatorFilter,
      afterGeminiRelevanceCheck: afterGeminiRelevance,
      afterBlocklistCheck: afterBlocklist,
      afterCategoryDetection,
      finalQualifyingCount: qualifyingJobs.length,
    },
    aggregatorRejections,
    qualifyingJobs,
  });
}

// --- Main handler ---
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.headers['authorization'] !== 'Bearer test123') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Dry run mode: full pipeline but no Redis writes and no Apollo enrichment
  if (req.query && req.query.dryrun === 'true') {
    return handleDryRun(req, res);
  }

  const today = new Date().toISOString().split('T')[0];
  const seenCompanies = new Set();
  const qualifiedLeads = [];
  let totalFetched = 0;
  let totalFiltered = 0;
  let geminiCalls = 0;
  const rejectionLog = [];

  const { companies: blockedCompanies, titles: blockedTitles } = await loadBlocklists();
  console.log(`Blocklists: ${blockedCompanies.length} companies, ${blockedTitles.length} titles`);

  const existingKeys = await redisKeys(`lead:${today}:*`);
  for (const key of existingKeys) {
    const lead = await redisGet(key);
    if (lead?.normalizedCompany) seenCompanies.add(lead.normalizedCompany);
  }

  const MAX_QUALIFIED = 30;

  for (const query of JSEARCH_QUERIES) {
    if (qualifiedLeads.length >= MAX_QUALIFIED) break;

    console.log(`Fetching: ${query}`);
    const jobs = await fetchJSearchPage(query);
    console.log(`Got ${jobs.length} jobs for: ${query}`);
    totalFetched += jobs.length;

    for (const job of jobs) {
      if (qualifiedLeads.length >= MAX_QUALIFIED) break;

      const title = job.job_title || '';
      const employer = job.employer_name || '';
      const description = job.job_description || '';
      const aggregatorHost = isAggregatorSource(job.job_apply_link, employer);
      if (aggregatorHost) {
        console.log('Filtered aggregator source:', employer, '-', aggregatorHost);
        rejectionLog.push({ jobTitle: title, company: employer, reason: 'aggregator-whitelist', timestamp: new Date().toISOString() });
        totalFiltered++; continue;
      }

      if (isExcludedTitle(title, blockedTitles)) { totalFiltered++; continue; }
      if (isJobBoard(employer)) { totalFiltered++; continue; }
      if (isContractRole(job)) { totalFiltered++; continue; }
      if (isBlockedCompany(employer, blockedCompanies)) {
        rejectionLog.push({ jobTitle: title, company: employer, reason: 'blocklist', timestamp: new Date().toISOString() });
        totalFiltered++; continue;
      }

      // Pre-Gemini employer keyword filter
      const empLower = employer.toLowerCase();
      const staffingHit = ['staffing','recruiting','recruitment','search partners','placement','via dice','robert half','virtual vocations','ilocatum','executiveplacements','jobot','akkodis','search & delivery','employment partners','vetjobs','vet jobs'].some(k => empLower.includes(k));
      const govEduHit = ['public schools','school district','township','department of'].some(k => empLower.includes(k)) || ['city of','county of','state of'].some(k => empLower.startsWith(k));
      if (staffingHit || govEduHit) {
        rejectionLog.push({ jobTitle: title, company: employer, reason: 'pre-gemini-keyword', timestamp: new Date().toISOString() });
        totalFiltered++; continue;
      }

      // Fast pre-filter: skip obviously irrelevant titles without a Gemini call
      if (!hasPrimaryKeyword(title)) { totalFiltered++; continue; }

      // All keyword-matching jobs go through Gemini for staffing/agency + relevance validation
      geminiCalls++;
      await sleep(250);
      const geminiResult = await isRelevantViaGemini(title, description);
      if (!geminiResult.relevant) {
        rejectionLog.push({ jobTitle: title, company: employer, reason: 'gemini-no', geminiResponse: geminiResult.response, timestamp: new Date().toISOString() });
        totalFiltered++; continue;
      }
      if (geminiResult.response === 'EMPTY_PASSTHROUGH' || geminiResult.response.startsWith('ERROR_PASSTHROUGH')) {
        rejectionLog.push({ jobTitle: title, company: employer, reason: 'gemini-empty', geminiResponse: geminiResult.response, timestamp: new Date().toISOString() });
      }

      const normalized = normalizeCompany(employer);
      if (seenCompanies.has(normalized)) {
        rejectionLog.push({ jobTitle: title, company: employer, reason: 'company-dedup', timestamp: new Date().toISOString() });
        totalFiltered++; continue;
      }
      seenCompanies.add(normalized);

      const category = await detectCategory(title, description);
      const leadId = `lead:${today}:${normalized.replace(/\s/g, '-').slice(0, 50)}`;

      let company_domain = null;
      try {
        if (job.employer_website) {
          company_domain = new URL(job.employer_website).hostname.replace(/^www\./, '');
        }
      } catch (e) {}

      // Infer domain via Gemini if missing
      if (!company_domain) {
        const locationStr = `${job.job_city || ''}, ${job.job_state || ''}`.trim().replace(/^,\s*/, '');
        try {
          geminiCalls++;
          const domainPrompt = `What is the primary website domain for this company?\n\nCompany name: ${employer}\nLocation: ${locationStr}\n\nReturn only the domain (e.g. acmecorp.com) with no explanation, no punctuation, no http or www prefix. Return the single word null if you are not confident.`;
          const domainRes = await fetchGemini({
            contents: [{ parts: [{ text: domainPrompt }] }],
            generationConfig: { maxOutputTokens: 30, temperature: 0 },
          });
          const domainData = await domainRes.json();
          const domainAnswer = (domainData.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().toLowerCase();
          console.log(`Gemini domain inference: ${employer} -> ${domainAnswer}`);
          if (domainAnswer && domainAnswer !== 'null' && domainAnswer.includes('.')) {
            company_domain = domainAnswer;
          } else {
            // Log to Redis and skip this lead
            await redisAppend('domain_inference_log', `${employer}, ${locationStr}\n`);
            console.log(`Skipping ${employer}: Gemini could not infer domain`);
            totalFiltered++;
            continue;
          }
        } catch (e) {
          console.error('Gemini domain inference error:', e.message);
          await redisAppend('domain_inference_log', `${employer}, ${job.job_city || ''}, ${job.job_state || ''}\n`);
          totalFiltered++;
          continue;
        }
      }

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
        employerWebsite: job.employer_website || '',
        company_domain,
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

  console.log(`Done: ${totalFetched} fetched, ${totalFiltered} filtered, ${qualifiedLeads.length} qualified, ${geminiCalls} Gemini calls, ${rejectionLog.length} Gemini rejections`);

  // Write Gemini rejection log to Redis (append to existing)
  if (rejectionLog.length > 0) {
    try {
      const existing = await redisGet('filter_rejection_log');
      const combined = (Array.isArray(existing) ? existing : []).concat(rejectionLog);
      await redisSet('filter_rejection_log', combined);
    } catch (e) {
      console.error('Failed to write rejection log:', e.message);
    }
  }

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
