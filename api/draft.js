// api/draft.js
// Generates personalized outreach email via Gemini with case study selection

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var body = req.body;
  if (!body || !body.jobTitle || !body.companyName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  var apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  var jobTitle = body.jobTitle || '';
  var companyName = body.companyName || '';
  var category = body.category || 'engineering';
  var contactTitle = body.contactTitle || 'Hiring Manager';
  var contactFirstName = body.contactFirstName || '';
  var description = body.description || '';
  var uniqid = body.uniqid || '*|UNIQID|*';

  var greeting = contactFirstName ? 'Hi ' + contactFirstName + ',' : 'Hi,';

  var caseStudies =
    'Select the most relevant case study based on the job and include a one-sentence natural reference with the tracked link:\n' +
    '- Engineering/manufacturing/production/operations roles: use "Filling Critical Manufacturing Roles in One Week" at https://impactbusinessgroup.com/case-studies/critical-manufacturing-roles-in-one-week/?cid=' + uniqid + ' -- angle: filled 3 specialized roles in under 2 weeks under urgent timeline\n' +
    '- VP/Director/executive engineering or operations roles: use "VP of Operations Executive Search" at https://impactbusinessgroup.com/case-studies/case-study-executive-search-vice-president-of-operations/?cid=' + uniqid + ' -- angle: confidential executive search, niche industry, hands-on leadership placement\n' +
    '- IT/software/tech roles: use "Greenfield Software System Project" at https://impactbusinessgroup.com/case-studies/greenfield-software-system-project/?cid=' + uniqid + ' -- angle: built entire product team from scratch on accelerated timeline\n' +
    '- GM/general manager/president/COO or other leadership roles: use "Perfect General Manager Hire" at https://impactbusinessgroup.com/case-studies/case-study-perfect-general-manager-hire/?cid=' + uniqid + ' -- angle: confidential values-based search, succession planning\n' +
    '- If no specific case study is a strong match, include a generic one-sentence reference linking to https://impactbusinessgroup.com/case-studies/?cid=' + uniqid + ' using natural language like "You can see some of our recent client work here." Always include a case study link in every generated email.\n';

  var prompt =
    'You are a business development writer for iMPact Business Group, a staffing and recruiting firm based in Grand Rapids MI and Tampa FL. IBG places professionals in IT, Engineering, Manufacturing, Accounting, Finance, and Business Administration roles nationally.\n\n' +
    'Write a short, authentic, personalized cold outreach email from an iMPact Business Group account manager to a hiring manager at ' + companyName + '. They are hiring for: ' + jobTitle + ' (category: ' + category + '). The contact is a ' + contactTitle + '.\n\n' +
    (description ? 'Here is the job description for additional context:\n' + description.slice(0, 1500) + '\n\n' : '') +
    'Requirements:\n' +
    '- Tone: genuine, direct, human. Not salesy. No buzzwords. No em dashes. No double hyphens.\n' +
    '- Length: 3-4 short paragraphs maximum\n' +
    '- Start the email body with "' + greeting + '"\n' +
    '- Personalize based on: company name, job title they are hiring for, contact name and title, job category, and any relevant details from the job description\n' +
    '- ' + caseStudies +
    '- End with a link to the website: https://impactbusinessgroup.com/?cid=' + uniqid + '\n' +
    '- Do NOT include a signature block\n' +
    '- Generate a personalized subject line as well\n\n' +
    'Return ONLY a JSON object with no markdown fencing, no backticks, no preamble. Exact shape:\n' +
    '{ "subject": "the subject line", "body": "HTML string with <p> tags for paragraphs and <a> tags for links" }';

  try {
    var geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
        })
      }
    );

    if (!geminiRes.ok) {
      console.error('Gemini draft error:', geminiRes.status);
      return res.status(500).json({ error: 'Draft generation failed' });
    }

    var data = await geminiRes.json();
    var text = data.candidates && data.candidates[0] && data.candidates[0].content &&
               data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
               data.candidates[0].content.parts[0].text;

    if (!text) return res.status(500).json({ error: 'Empty response from Gemini' });

    var clean = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    var parsed = JSON.parse(clean);

    return res.status(200).json({
      subject: parsed.subject || '',
      body: parsed.body || ''
    });
  } catch (e) {
    console.error('Draft generation error:', e.message);
    return res.status(500).json({ error: 'Draft generation failed' });
  }
};
