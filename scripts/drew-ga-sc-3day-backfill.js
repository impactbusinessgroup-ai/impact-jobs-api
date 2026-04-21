// scripts/drew-ga-sc-3day-backfill.js
//
// One-time 3-day historical fetch for the coastal-GA / Lowcountry-SC queries
// so Drew Bentsen has a seeded queue. Runs the same filter / classify /
// enrichment pipeline the daily cron uses (via api/_jobs_helpers + assignAM
// from api/_routing), with date_posted overridden to "3days". Marker-guarded.

require('dotenv').config({ path: '.env.local' });

const path = require('path');
const { assignAM } = require(path.join('..', 'api', '_routing'));
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
} = require(path.join('..', 'api', '_jobs_helpers'));

const MARKER_KEY = 'script_marker:drew_ga_sc_3day_backfill_2026_04_21';
const QUERIES = [
  'engineer Savannah Georgia',
  'IT Savannah Georgia',
  'accountant Savannah Georgia',
  'engineer Bluffton South Carolina',
  'IT Bluffton South Carolina',
  'accountant Bluffton South Carolina',
];

async function main() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error('Missing KV_REST_API_URL / KV_REST_API_TOKEN');
    process.exit(1);
  }
  if (!process.env.JSEARCH_API_KEY || !process.env.GOOGLE_API_KEY) {
    console.error('Missing JSEARCH_API_KEY / GOOGLE_API_KEY');
    process.exit(1);
  }

  const marker = await redisGet(MARKER_KEY);
  if (marker) {
    console.log('Marker present (' + MARKER_KEY + '):', JSON.stringify(marker));
    console.log('3-day GA/SC backfill already ran. Exiting without changes.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();
  const seenCompanyTitles = new Set();
  const qualifiedLeads = [];
  const createdSamples = [];
  const droppedReasons = { aggregator:0, excludedTitle:0, jobBoard:0, contract:0, blockedCompany:0, staffingOrGov:0, notPrimary:0, geminiNo:0, dedup:0, noDomain:0 };
  let totalFetched = 0;
  let geminiCalls = 0;

  const { companies: blockedCompanies, titles: blockedTitles } = await loadBlocklists();
  console.log('Blocklists loaded:', blockedCompanies.length, 'companies,', blockedTitles.length, 'titles');

  // Pre-load every existing lead so routing stays load-balanced and dedup hits
  // against the full history (not just today's prefix).
  const existingLeadKeys = await redisKeys('lead:*');
  const allLeadsForRouting = [];
  for (const k of existingLeadKeys) {
    const l = await redisGet(k);
    if (!l) continue;
    allLeadsForRouting.push(l);
    const nc = l.normalizedCompany || '';
    const nt = l.normalizedTitle || normalizeTitle(l.jobTitle || '');
    if (nc) seenCompanyTitles.add(nc + '|' + nt);
  }
  console.log('Hydrated', allLeadsForRouting.length, 'existing leads for dedup + routing.');

  for (const query of QUERIES) {
    console.log('\n[backfill] Fetching (3days):', query);
    const jobs = await fetchJSearchPage(query, { datePosted: '3days' });
    console.log('[backfill] Got', jobs.length, 'jobs for:', query);
    totalFetched += jobs.length;

    for (const job of jobs) {
      const title = job.job_title || '';
      const employer = job.employer_name || '';
      const description = job.job_description || '';

      const aggHost = isAggregatorSource(job.job_apply_link, employer);
      if (aggHost) { droppedReasons.aggregator++; continue; }
      if (isExcludedTitle(title, blockedTitles)) { droppedReasons.excludedTitle++; continue; }
      if (isJobBoard(employer)) { droppedReasons.jobBoard++; continue; }
      if (isContractRole(job)) { droppedReasons.contract++; continue; }
      if (isBlockedCompany(employer, blockedCompanies)) { droppedReasons.blockedCompany++; continue; }
      if (hasStaffingOrGovHit(employer)) { droppedReasons.staffingOrGov++; continue; }
      if (!hasPrimaryKeyword(title)) { droppedReasons.notPrimary++; continue; }

      geminiCalls++;
      await sleep(250);
      const rel = await isRelevantViaGemini(title, description);
      if (!rel.relevant) { droppedReasons.geminiNo++; continue; }

      const normalized = normalizeCompany(employer);
      const normalizedTitle = normalizeTitle(title);
      const dedupKey = normalized + '|' + normalizedTitle;
      if (seenCompanyTitles.has(dedupKey)) { droppedReasons.dedup++; continue; }
      seenCompanyTitles.add(dedupKey);

      const category = await detectCategory(title, description);
      const companySlug = normalized.replace(/\s/g, '-').slice(0, 30);
      const titleSlug = normalizedTitle.replace(/\s/g, '-').slice(0, 30);
      const leadId = `lead:${today}:${companySlug}-${titleSlug}`;

      let company_domain = null;
      try {
        if (job.employer_website) company_domain = new URL(job.employer_website).hostname.replace(/^www\./, '');
      } catch (e) {}
      const locationStr = `${job.job_city || ''}, ${job.job_state || ''}`.trim().replace(/^,\s*/, '');
      if (!company_domain) {
        geminiCalls++;
        company_domain = await inferCompanyDomain(employer, locationStr);
        if (!company_domain) { droppedReasons.noDomain++; continue; }
      }

      // Route — Drew-exclusive zone should win for every lead from these queries.
      const route = await assignAM({
        category,
        location: locationStr,
        company: employer,
        allLeads: allLeadsForRouting,
      });
      const assignedAM = route ? route.name : 'Drew Bentsen';
      const assignedAMEmail = route ? route.email : 'dbentsen@impactbusinessgroup.com';

      const lead = {
        id: leadId,
        date: today,
        jobTitle: title,
        company: employer,
        normalizedCompany: normalized,
        normalizedTitle: normalizedTitle,
        location: locationStr,
        description: description.slice(0, 2000),
        source: 'jsearch-3day-backfill',
        jobUrl: job.job_apply_link || '',
        employerWebsite: job.employer_website || '',
        company_domain,
        category,
        status: 'new',
        contacts: [],
        assignedAM,
        assignedAMEmail,
        assignedAt: nowIso,
        createdAt: Date.now(),
      };

      await redisSet(leadId, lead, 60 * 60 * 24 * 14);
      qualifiedLeads.push(leadId);
      allLeadsForRouting.push(lead);
      createdSamples.push({ company: employer, title, location: locationStr, category, am: assignedAM, source: route ? route.source : 'fallback' });
    }

    await sleep(400);
  }

  await redisSet(MARKER_KEY, {
    ranAt: nowIso,
    queries: QUERIES,
    totalFetched,
    geminiCalls,
    qualified: qualifiedLeads.length,
    droppedReasons,
  }, 60 * 60 * 24 * 365);

  console.log('\n========== REPORT ==========');
  console.log('Queries run:                 ', QUERIES.length);
  console.log('Total jobs from JSearch:     ', totalFetched);
  console.log('Gemini calls:                ', geminiCalls);
  console.log('Final leads saved:           ', qualifiedLeads.length);
  console.log('\nDropped per reason:');
  Object.keys(droppedReasons).forEach(r => console.log('  ' + r.padEnd(20) + ' : ' + droppedReasons[r]));

  if (createdSamples.length) {
    console.log('\nCreated leads:');
    createdSamples.forEach(s => console.log('  -', s.company.padEnd(40), '|', s.title.slice(0, 60).padEnd(60), '|', s.location.padEnd(25), '|', s.category.padEnd(11), '|', s.am, '(' + s.source + ')'));

    const byAm = {};
    const bySource = {};
    createdSamples.forEach(s => { byAm[s.am] = (byAm[s.am] || 0) + 1; bySource[s.source] = (bySource[s.source] || 0) + 1; });
    console.log('\nBy AM:');
    Object.keys(byAm).forEach(a => console.log('  ' + a.padEnd(25) + ' : ' + byAm[a]));
    console.log('\nBy routing source:');
    Object.keys(bySource).forEach(s => console.log('  ' + s.padEnd(25) + ' : ' + bySource[s]));
  }

  console.log('\nMarker stored at', MARKER_KEY);
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
