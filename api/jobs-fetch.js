// api/jobs-fetch.js

const { assignAM } = require('./_routing');
const {
  sleep,
  redisGet,
  redisSet,
  redisKeys,
  loadBlocklists,
  normalizeCompany,
  normalizeTitle,
  detectCategory,
  hasPrimaryKeyword,
  isRelevantViaGemini,
  isAggregatorSource,
  isJobBoard,
  isContractRole,
  isExcludedTitle,
  isBlockedCompany,
  hasStaffingOrGovHit,
  fetchJSearchPage,
  inferCompanyDomain,
} = require('./_jobs_helpers');

const JSEARCH_QUERIES = [
  // West Michigan
  'engineer Grand Rapids Michigan',
  'accounting Grand Rapids Michigan',
  'information technology Grand Rapids Michigan',
  'engineer Muskegon Michigan',
  'engineer Holland Michigan',
  'engineer Zeeland Michigan',
  'engineer Rockford Michigan',
  // Tampa Bay
  'engineer Tampa Florida',
  'accounting Tampa Florida',
  'information technology Tampa Florida',
  'engineer St. Petersburg Florida',
  'engineer Clearwater Florida',
  'accounting St. Petersburg Florida',
  // Coastal GA / SC Lowcountry (Drew-exclusive territory — routed to Drew via assignAM)
  'engineer Savannah Georgia',
  'IT Savannah Georgia',
  'accountant Savannah Georgia',
  'engineer Bluffton South Carolina',
  'IT Bluffton South Carolina',
  'accountant Bluffton South Carolina',
];

// --- Dry run handler ---
async function handleDryRun(req, res) {
  const seenCompanyTitles = new Set();
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
    const jobs = await fetchJSearchPage(query, { numPages: 1, datePosted: '3days' });
    console.log(`[dry-run] Got ${jobs.length} jobs for: ${query}`);
    totalFetched += jobs.length;

    for (const job of jobs) {
      const title = job.job_title || '';
      const employer = job.employer_name || '';
      const description = job.job_description || '';

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

      await sleep(250);
      const geminiResult = await isRelevantViaGemini(title, description);
      if (!geminiResult.relevant) continue;
      afterGeminiRelevance++;

      if (isBlockedCompany(employer, blockedCompanies)) continue;
      const normalized = normalizeCompany(employer);
      const normalizedTitle = normalizeTitle(title);
      const dedupKey = normalized + '|' + normalizedTitle;
      if (seenCompanyTitles.has(dedupKey)) continue;
      seenCompanyTitles.add(dedupKey);
      afterBlocklist++;

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

    await sleep(300);
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

  if (req.headers['authorization'] !== 'Bearer ' + process.env.JOBS_CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Dry run mode: full pipeline but no Redis writes and no Apollo enrichment
  if (req.query && req.query.dryrun === 'true') {
    return handleDryRun(req, res);
  }

  const today = new Date().toISOString().split('T')[0];
  const seenCompanyTitles = new Set();
  const qualifiedLeads = [];
  let totalFetched = 0;
  let totalFiltered = 0;
  let geminiCalls = 0;

  const { companies: blockedCompanies, titles: blockedTitles } = await loadBlocklists();
  console.log(`Blocklists: ${blockedCompanies.length} companies, ${blockedTitles.length} titles`);

  // Load all leads up-front so the routing module can load-balance against
  // current active counts when assigning new leads.
  const allLeadKeys = await redisKeys('lead:*');
  const allLeadsForRouting = [];
  for (const key of allLeadKeys) {
    const lead = await redisGet(key);
    if (!lead) continue;
    allLeadsForRouting.push(lead);
    if (key.startsWith(`lead:${today}:`)) {
      const nc = lead.normalizedCompany || '';
      const nt = lead.normalizedTitle || normalizeTitle(lead.jobTitle || '');
      if (nc) seenCompanyTitles.add(nc + '|' + nt);
    }
  }

  const MAX_QUALIFIED = 50;

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
        totalFiltered++; continue;
      }
      if (isExcludedTitle(title, blockedTitles)) { totalFiltered++; continue; }
      if (isJobBoard(employer)) { totalFiltered++; continue; }
      if (isContractRole(job)) { totalFiltered++; continue; }
      if (isBlockedCompany(employer, blockedCompanies)) { totalFiltered++; continue; }
      if (hasStaffingOrGovHit(employer)) { totalFiltered++; continue; }
      if (!hasPrimaryKeyword(title)) { totalFiltered++; continue; }

      geminiCalls++;
      await sleep(250);
      const geminiResult = await isRelevantViaGemini(title, description);
      if (!geminiResult.relevant) { totalFiltered++; continue; }

      const normalized = normalizeCompany(employer);
      const normalizedTitle = normalizeTitle(title);
      const dedupKey = normalized + '|' + normalizedTitle;
      if (seenCompanyTitles.has(dedupKey)) { totalFiltered++; continue; }
      seenCompanyTitles.add(dedupKey);

      const category = await detectCategory(title, description);
      const companySlug = normalized.replace(/\s/g, '-').slice(0, 30);
      const titleSlug = normalizedTitle.replace(/\s/g, '-').slice(0, 30);
      const leadId = `lead:${today}:${companySlug}-${titleSlug}`;

      let company_domain = null;
      try {
        if (job.employer_website) {
          company_domain = new URL(job.employer_website).hostname.replace(/^www\./, '');
        }
      } catch (e) {}

      const locationStr = `${job.job_city || ''}, ${job.job_state || ''}`.trim().replace(/^,\s*/, '');

      if (!company_domain) {
        geminiCalls++;
        company_domain = await inferCompanyDomain(employer, locationStr);
        if (!company_domain) {
          console.log(`Skipping ${employer}: Gemini could not infer domain`);
          totalFiltered++;
          continue;
        }
      }

      // Full round-robin routing: Drew-exclusive GA/SC zone wins first, then
      // Mailchimp REP override (most-contacts tiebreak), then Tampa rotation,
      // then category-pool load-balanced round robin. See api/_routing.js.
      const route = await assignAM({
        category,
        location: locationStr,
        company: employer,
        allLeads: allLeadsForRouting,
      });
      const assignedAM = route ? route.name : 'Mark Sapoznikov';
      const assignedAMEmail = route ? route.email : 'msapoznikov@impactbusinessgroup.com';
      console.log('Assigned', employer, '->', assignedAM, '(' + (route ? route.source : 'fallback') + ')');

      const lead = {
        id: leadId,
        date: today,
        jobTitle: title,
        company: employer,
        normalizedCompany: normalized,
        normalizedTitle: normalizedTitle,
        location: locationStr,
        description: description.slice(0, 2000),
        source: 'jsearch',
        jobUrl: job.job_apply_link || '',
        employerWebsite: job.employer_website || '',
        company_domain,
        category,
        status: 'new',
        contacts: [],
        assignedAM,
        assignedAMEmail,
        assignedAt: new Date().toISOString(),
        createdAt: Date.now(),
      };

      await redisSet(leadId, lead, 60 * 60 * 24 * 14);
      qualifiedLeads.push(leadId);
      // Keep routing balance accurate for the rest of this run.
      allLeadsForRouting.push(lead);
    }

    await sleep(300);
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
