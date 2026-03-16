const axios = require('axios');
const xml2js = require('xml2js');

const FEED_URL = 'http://careers.haleymarketing.com/xml/xml.smpl?id=102088&pass=impactbg';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { role, location } = req.query;

  if (!role) {
    return res.status(400).json({ error: 'Role parameter is required' });
  }

  try {
    const response = await axios.get(FEED_URL);
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(response.data);

    const jobs = result?.jobs?.job || [];
    const jobArray = Array.isArray(jobs) ? jobs : [jobs];

    const roleTerms = role.toLowerCase().split(' ');
    const locationTerm = location ? location.toLowerCase() : null;

    const matches = jobArray.filter(job => {
      const titleMatch = roleTerms.some(term =>
        job.title?.toLowerCase().includes(term)
      );
      const keywordMatch = roleTerms.some(term =>
        job.keywords?.toLowerCase().includes(term)
      );
      const descriptionMatch = roleTerms.some(term =>
        job.description?.toLowerCase().includes(term)
      );
      const requirementsMatch = roleTerms.some(term =>
        job.requirements?.toLowerCase().includes(term)
      );

      const roleMatch = titleMatch || keywordMatch || descriptionMatch || requirementsMatch;

      const locationMatch = locationTerm
        ? job.city?.toLowerCase().includes(locationTerm) ||
          job.state?.toLowerCase().includes(locationTerm) ||
          job.zip?.toLowerCase().includes(locationTerm)
        : true;

      return roleMatch && locationMatch;
    });

    const topMatches = matches.slice(0, 3).map(job => ({
      title: job.title || '',
      location: `${job.city || ''}, ${job.state || ''}`,
      pay_rate: job.salary || 'Not specified',
      job_id: job.referencenumber || job.id || '',
      summary: job.description
        ? job.description.substring(0, 200) + '...'
        : '',
      apply_url: `https://jobs.impactbusinessgroup.com/index.smpl?arg=jb_details&jid=${job.referencenumber || job.id}&rid=TawkToChat`
    }));

    return res.status(200).json({
      count: topMatches.length,
      jobs: topMatches
    });

  } catch (error) {
    console.error('Feed error:', error);
    return res.status(500).json({ error: 'Failed to fetch job data' });
  }
}
