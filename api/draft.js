// api/draft.js
// Generates personalized outreach email via Gemini with case study selection

var CALENDLY = {
  "cwillbrandt@impactbusinessgroup.com": "https://calendly.com/cwillbrandt/phone-call",
  "dbentsen@impactbusinessgroup.com": "https://calendly.com/dbentsen",
  "dkoetsier@impactbusinessgroup.com": "https://calendly.com/dkoetsier/",
  "dkunkel@impactbusinessgroup.com": "https://calendly.com/drewkunkel/15min",
  "dteliczan@impactbusinessgroup.com": "https://calendly.com/dteliczan-impactbusinessgroup",
  "jdrajka@impactbusinessgroup.com": "https://calendly.com/jdrajka",
  "lsylvester@impactbusinessgroup.com": "https://calendly.com/lsylvester",
  "mherman@impactbusinessgroup.com": "https://calendly.com/markherman",
  "mpeal@impactbusinessgroup.com": "https://calendly.com/mattpeal/15min",
  "pkujawski@impactbusinessgroup.com": "https://calendly.com/pkujawski",
  "sbetteley@impactbusinessgroup.com": "https://calendly.com/sbetteley",
  "tray@impactbusinessgroup.com": "https://calendly.com/tray-impactbusinessgroup",
  "twangler@impactbusinessgroup.com": "https://calendly.com/twangler-impactbusinessgroup/15min",
  "msapoznikov@impactbusinessgroup.com": "https://calendly.com/msapoznikov"
};

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
  var contactName = body.contactName || contactFirstName;
  var description = body.description || '';
  var uniqid = body.uniqid || '*|UNIQID|*';
  var amEmail = body.amEmail || 'msapoznikov@impactbusinessgroup.com';
  var calendlyLink = CALENDLY[amEmail] || 'https://calendly.com/msapoznikov';

  var greeting = contactFirstName ? 'Hi ' + contactFirstName + ',' : 'Hi,';

  var caseStudies =
    'Select the most relevant case study and include a one-sentence natural reference with the tracked link:\n' +
    '- Engineering/manufacturing/production/supply chain/operations roles: "Filling Critical Manufacturing Roles in One Week" at https://impactbusinessgroup.com/case-studies/critical-manufacturing-roles-in-one-week/?cid=' + uniqid + ' -- filled 3 specialized roles in under 2 weeks under urgent timeline\n' +
    '- VP/Director/executive engineering or operations leadership roles: "VP of Operations Executive Search" at https://impactbusinessgroup.com/case-studies/case-study-executive-search-vice-president-of-operations/?cid=' + uniqid + ' -- confidential executive search, niche industry, hands-on leadership placement\n' +
    '- IT/software/tech roles: "Greenfield Software System Project" at https://impactbusinessgroup.com/case-studies/greenfield-software-system-project/?cid=' + uniqid + ' -- built entire product team from scratch on accelerated timeline\n' +
    '- GM/general manager/president/COO or senior leadership roles: "Perfect General Manager Hire" at https://impactbusinessgroup.com/case-studies/case-study-perfect-general-manager-hire/?cid=' + uniqid + ' -- confidential values-based search, succession planning\n' +
    '- If no specific case study fits, use: https://impactbusinessgroup.com/case-studies/?cid=' + uniqid + ' with natural language like "You can see some of our recent client work here." Always include a case study link.\n';

  var prompt =
    'You are writing a cold outreach email for iMPact Business Group, a staffing firm in Grand Rapids MI and Tampa FL placing IT, Engineering, Manufacturing, Accounting, Finance, and Business Administration professionals nationally.\n\n' +
    'Write to a ' + contactTitle + ' at ' + companyName + ' about their ' + jobTitle + ' opening (category: ' + category + ').\n\n' +
    (description ? 'Job description context:\n' + description.slice(0, 1500) + '\n\n' : '') +
    'WRITING STYLE:\n' +
    '- Sound like a real person who wrote this quickly. Short, direct, confident.\n' +
    '- Do NOT restate what the hiring manager already knows about their own job opening.\n' +
    '- Do NOT use phrases like "I noticed you are looking for" or "I came across your posting."\n' +
    '- Open with a direct, confident line about what iMPact does or a relevant result.\n' +
    '- Add one specific detail showing knowledge of their company or industry.\n' +
    '- No buzzwords. No AI-sounding language. No em dashes. No double hyphens.\n' +
    '- 3 short paragraphs maximum.\n' +
    '- Start with "' + greeting + '"\n\n' +
    'CASE STUDY:\n' + caseStudies + '\n' +
    'END OF EMAIL:\n' +
    '- Include this line: Learn more about how we can help: https://impactbusinessgroup.com/employers/?cid=' + uniqid + '\n' +
    '- Then include the Calendly link with natural language like "Happy to find a time to connect:" followed by: ' + calendlyLink + '\n' +
    '- Do NOT include a signature block.\n\n' +
    'Generate a personalized subject line as well.\n\n' +
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
