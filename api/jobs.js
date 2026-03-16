const https = require('https');
const http = require('http');

const FEED_URL = 'http://careers.haleymarketing.com/xml/xml.smpl?id=102088&pass=impactbg';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseJobs(xml) {
  const jobs = [];
  const jobBlocks = xml.split('<job>');
  jobBlocks.shift();
  for (const block of jobBlocks) {
    const get = (field) => {
      const match = block.match(new RegExp(`<${field}[^>]*>([\\s\\S]*?)<\\/${field}>`, 'i'));
      return match ? match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
    };
    jobs.push({
      title: get('title'),
      city: get('city'),
      state: get('state'),
      salary: get('salary'),
      id: get('referencenumber') || get('id'),
      keywords: get('keywords'),
      description: get('description'),
      requirements: get('requirements')
    });
  }
  return jobs;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { role, location } = req.query;

  if (!role) {
    return res.status(400).json({ error: 'Role parameter is required' });
  }

  try {
    const xml = await fetchUrl(FEED_URL);
    const jobs = parseJobs(xml);
    const roleTerms = role.toLowerCase().split(' ');
    const locationTerm = location ? location.toLowerCase() : null;

    const matches = jobs.filter(job => {
      const searchText = `${job.title} ${job.keywords} ${job.description} ${job.requirements}`.toLowerCase();
      const roleMatch = roleTerms.some(term => searchText.includes(term));
      const locationMatch = locationTerm
        ? `${job.city} ${job.state}`.toLowerCase().includes(locationTerm)
        : true;
      return roleMatch && locationMatch;
    });

    const results = matches.slice(0, 3).map(job => ({
      title: job.title,
      location: `${job.city}, ${job.state}`,
      pay_rate: job.salary || 'Not specified',
      job_id: job.id,
      summary: job.description.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim().split(/[.!?]+/).filter(s => s.trim().length > 0).slice(0, 2).join('. ').substring(0, 300) + '.',
      apply_url: `https://jobs.impactbusinessgroup.com/index.smpl?arg=jb_details&jid=${job.id}&rid=TawkToChat`
    }));

    return res.status(200).json({ count: results.length, jobs: results });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to fetch job data' });
  }
}
