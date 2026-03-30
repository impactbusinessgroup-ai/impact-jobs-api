// api/jobs-fetch.js

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

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.headers['authorization'] !== 'Bearer test123') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('JSEARCH_API_KEY present:', !!process.env.JSEARCH_API_KEY);

  const testQuery = 'engineer Grand Rapids Michigan';
  const params = new URLSearchParams({
    query: testQuery,
    page: '1',
    num_pages: '1',
    date_posted: '3days',
    country: 'us',
    radius: '50',
  });

  const testUrl = `https://jsearch.p.rapidapi.com/search?${params}`;
  const testRes = await fetch(testUrl, {
    headers: {
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      'x-rapidapi-key': process.env.JSEARCH_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  const rawData = await testRes.json();
  console.log('JSearch status:', testRes.status);
  console.log('JSearch response:', JSON.stringify(rawData).slice(0, 500));

  return res.status(200).json({
    ok: true,
    jsearchStatus: testRes.status,
    dataKeys: Object.keys(rawData),
    dataCount: rawData.data?.length || 0,
    rawSample: JSON.stringify(rawData).slice(0, 1000),
  });
};
