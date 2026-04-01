// api/draft.js
// Generates personalized outreach email + LinkedIn message via Gemini

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

  var greeting = contactFirstName ? 'Hi ' + contactFirstName + ',' : 'Hi,';

  var prompt = 'You are a business development writer for iMPact Business Group, a staffing and recruiting firm based in Grand Rapids MI and Tampa FL. IBG places professionals in IT, Engineering, Manufacturing, Accounting, Finance, and Business Administration roles nationally.\n\n' +
    'Generate outreach for a lead at ' + companyName + '. They are hiring for: ' + jobTitle + ' (' + category + '). The contact is a ' + contactTitle + '.\n\n' +
    'Write two things:\n' +
    '1) A concise cold email subject line and body. Start the email with "' + greeting + '". The email body should be 3-4 short paragraphs: acknowledge their hiring activity for a ' + jobTitle + ', briefly explain what IBG does, offer a specific value (faster placement, pre-screened candidates, contingency-based so no upfront cost), and close with a soft CTA asking if they are open to a quick call. End with this exact signature: "Mark Sapoznikov\niMPact Business Group\nmsapoznikov@impactbusinessgroup.com"\n' +
    '2) A LinkedIn message under 280 characters that references their hiring for ' + jobTitle + ' and offers to connect. Keep it conversational and non-salesy.\n\n' +
    'Return ONLY a JSON object with no markdown fencing, no backticks, no preamble. Exact shape: { "emailSubject": "...", "emailBody": "...", "linkedinMessage": "..." }';

  try {
    var geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
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
      emailSubject: parsed.emailSubject || '',
      emailBody: parsed.emailBody || '',
      linkedinMessage: parsed.linkedinMessage || ''
    });
  } catch (e) {
    console.error('Draft generation error:', e.message);
    return res.status(500).json({ error: 'Draft generation failed' });
  }
};
