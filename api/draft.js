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
  console.log('[draft] Incoming request:', JSON.stringify({ action: body && body.action, jobTitle: body && body.jobTitle, companyName: body && body.companyName, contactFirstName: body && body.contactFirstName, category: body && body.category, hasDescription: !!(body && body.description) }));
  if (!body || !body.jobTitle || !body.companyName) {
    console.log('[draft] Rejected: missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  var apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.log('[draft] Rejected: no GEMINI_API_KEY'); return res.status(500).json({ error: 'GEMINI_API_KEY not configured' }); }

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

  // Subject-only generation
  if (body.action === 'subject_only') {
    var subjPrompt = 'Generate a short, personalized email subject line for a cold outreach to a ' + contactTitle + ' at ' + companyName + ' about their ' + jobTitle + ' opening. The subject MUST include the job title "' + jobTitle + '". Make it direct and professional, not clickbaity. No em dashes. Return ONLY a JSON object: { "subject": "the subject line" }';
    try {
      var sjRes = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + apiKey,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: subjPrompt }] }], generationConfig: { maxOutputTokens: 100, temperature: 0.8 } }) }
      );
      if (!sjRes.ok) return res.status(500).json({ error: 'Subject generation failed' });
      var sjData = await sjRes.json();
      var sjText = sjData.candidates && sjData.candidates[0] && sjData.candidates[0].content && sjData.candidates[0].content.parts && sjData.candidates[0].content.parts[0] && sjData.candidates[0].content.parts[0].text;
      if (!sjText) return res.status(500).json({ error: 'Empty subject response' });
      var sjClean = sjText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      var sjParsed = JSON.parse(sjClean);
      return res.status(200).json({ subject: sjParsed.subject || '' });
    } catch (e) {
      console.error('Subject generation error:', e.message);
      return res.status(500).json({ error: 'Subject generation failed' });
    }
  }

  // LinkedIn message generation
  if (body.action === 'linkedin') {
    var liPrompt =
      'Write a short LinkedIn message from an iMPact Business Group account manager to a hiring manager at ' + companyName + ' about their ' + jobTitle + ' opening.\n\n' +
      'Requirements:\n' +
      '- Under 280 characters total including the link below.\n' +
      '- Direct and human, not generic. You MUST reference the specific job title "' + jobTitle + '" and company name "' + companyName + '". Do not use a generic opener.\n' +
      '- NEVER use "I noticed", "I came across", or any variation. Open with what iMPact does for that type of role.\n' +
      '- One sentence about what iMPact does specifically for ' + category + ' placements.\n' +
      '- End with: Learn more about how we can help: https://impactbusinessgroup.com/employers/?cid=' + uniqid + '\n' +
      '- Then on a new line: Happy to find a time to connect: ' + calendlyLink + '\n' +
      '- No em dashes. No AI-sounding language. Keep it natural.\n' +
      '- Start with "' + greeting + '"\n\n' +
      'Return ONLY a JSON object: { "linkedinMessage": "the message as plain text" }';

    try {
      var liRes = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + apiKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: liPrompt }] }],
            generationConfig: { maxOutputTokens: 400, temperature: 0.7 }
          })
        }
      );
      if (!liRes.ok) return res.status(500).json({ error: 'LinkedIn draft failed' });
      var liData = await liRes.json();
      var liText = liData.candidates && liData.candidates[0] && liData.candidates[0].content &&
                   liData.candidates[0].content.parts && liData.candidates[0].content.parts[0] &&
                   liData.candidates[0].content.parts[0].text;
      if (!liText) return res.status(500).json({ error: 'Empty LI response' });
      var liClean = liText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      var liParsed = JSON.parse(liClean);
      // Strip any anchor tags - LinkedIn must be plain text only
      var liMsg = (liParsed.linkedinMessage || '').replace(/<a[^>]*>/gi, '').replace(/<\/a>/gi, '');
      return res.status(200).json({ linkedinMessage: liMsg });
    } catch (e) {
      console.error('LinkedIn draft error:', e.message);
      return res.status(500).json({ error: 'LinkedIn draft failed' });
    }
  }

  // Aggressively match case study based on job description keywords
  var descLower = (description || '').toLowerCase() + ' ' + (jobTitle || '').toLowerCase() + ' ' + (category || '').toLowerCase();
  var mfgKeywords = ['manufacturing', 'production', 'supply chain', 'cnc', 'machinist', 'assembly', 'automation', 'quality', 'plant operations', 'warehouse', 'logistics', 'fabricat', 'weld', 'maintenance', 'industrial'];
  var execKeywords = ['vp', 'vice president', 'director', 'executive', 'senior director', 'svp'];
  var itKeywords = ['software', 'developer', 'engineer', 'devops', 'cloud', 'data', 'cyber', 'network', 'sysadmin', 'architect', 'full stack', 'frontend', 'backend', 'it manager'];
  var gmKeywords = ['general manager', 'president', 'coo', 'chief operating', 'gm', 'plant manager', 'site leader'];

  var isMfg = mfgKeywords.some(function(k) { return descLower.indexOf(k) !== -1; });
  var isExec = execKeywords.some(function(k) { return descLower.indexOf(k) !== -1; });
  var isIT = category === 'it' || itKeywords.some(function(k) { return descLower.indexOf(k) !== -1; });
  var isGM = gmKeywords.some(function(k) { return descLower.indexOf(k) !== -1; });

  var caseStudyInstruction = '';
  if (isGM) {
    caseStudyInstruction = 'Reference this case study naturally in one sentence: "Perfect General Manager Hire" at https://impactbusinessgroup.com/case-studies/case-study-perfect-general-manager-hire/?cid=' + uniqid + ' -- confidential values-based search, succession planning.';
  } else if (isExec && (isMfg || category === 'engineering')) {
    caseStudyInstruction = 'Reference this case study naturally in one sentence: "VP of Operations Executive Search" at https://impactbusinessgroup.com/case-studies/case-study-executive-search-vice-president-of-operations/?cid=' + uniqid + ' -- confidential executive search, niche industry, hands-on leadership.';
  } else if (isIT) {
    caseStudyInstruction = 'Reference this case study naturally in one sentence: "Greenfield Software System Project" at https://impactbusinessgroup.com/case-studies/greenfield-software-system-project/?cid=' + uniqid + ' -- built entire product team from scratch on accelerated timeline.';
  } else if (isMfg || category === 'engineering') {
    caseStudyInstruction = 'Reference this case study naturally in one sentence: "Filling Critical Manufacturing Roles in One Week" at https://impactbusinessgroup.com/case-studies/critical-manufacturing-roles-in-one-week/?cid=' + uniqid + ' -- filled 3 specialized roles in under 2 weeks under urgent timeline.';
  } else {
    caseStudyInstruction = 'Reference our case studies page naturally: https://impactbusinessgroup.com/case-studies/?cid=' + uniqid + ' with language like "You can see some of our recent client work here."';
  }

  var prompt =
    'You are writing a cold outreach email for iMPact Business Group, a staffing firm in Grand Rapids MI and Tampa FL placing IT, Engineering, Manufacturing, Accounting, Finance, and Business Administration professionals nationally.\n\n' +
    'Write to a ' + contactTitle + ' at ' + companyName + ' about their ' + jobTitle + ' opening (category: ' + category + ').\n\n' +
    (description ? 'Job description context:\n' + description.slice(0, 1500) + '\n\n' : '') +
    'WRITING STYLE:\n' +
    '- Sound like a real person who wrote this quickly. Short, direct, confident.\n' +
    '- NEVER start with "I noticed", "I came across", "I saw your posting", or any variation of restating their job posting. These are banned phrases.\n' +
    '- Open with a direct statement about iMPact\'s relevant experience or a concrete result. Example: "We recently placed three specialized engineers in under two weeks for a company in a similar situation."\n' +
    '- Add one specific detail showing knowledge of their company or industry.\n' +
    '- No buzzwords. No AI-sounding language. No em dashes. No double hyphens.\n' +
    '- Use correct articles: "an" before vowel sounds (e.g., "an Automation Engineer"), "a" before consonant sounds (e.g., "a Manufacturing Engineer").\n' +
    '- 3 short paragraphs maximum.\n' +
    '- Start with "' + greeting + '"\n\n' +
    'CASE STUDY:\n' + caseStudyInstruction + '\n\n' +
    'END OF EMAIL:\n' +
    '- Include this line: Learn more about how we can help: https://impactbusinessgroup.com/employers/?cid=' + uniqid + '\n' +
    '- Then include the Calendly link with natural language like "Happy to find a time to connect:" followed by: ' + calendlyLink + '\n' +
    '- Do NOT include a signature block.\n\n' +
    'Generate a personalized subject line that includes the job title "' + jobTitle + '".\n\n' +
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
      var errBody = await geminiRes.text();
      console.error('[draft] Gemini HTTP error:', geminiRes.status, errBody.slice(0, 500));
      return res.status(500).json({ error: 'Draft generation failed' });
    }

    var data = await geminiRes.json();
    var text = data.candidates && data.candidates[0] && data.candidates[0].content &&
               data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
               data.candidates[0].content.parts[0].text;

    console.log('[draft] Gemini response candidates:', data.candidates ? data.candidates.length : 0, 'blockReason:', data.candidates && data.candidates[0] && data.candidates[0].finishReason, 'promptFeedback:', JSON.stringify(data.promptFeedback || null));
    if (!text) {
      console.error('[draft] Empty Gemini text. Full response:', JSON.stringify(data).slice(0, 1000));
      return res.status(500).json({ error: 'Empty response from Gemini' });
    }

    console.log('[draft] Raw Gemini text (first 300):', text.slice(0, 300));
    var clean = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    var parsed = JSON.parse(clean);

    console.log('[draft] Success: subject=', (parsed.subject || '').slice(0, 80), 'bodyLen=', (parsed.body || '').length);
    return res.status(200).json({
      subject: parsed.subject || '',
      body: parsed.body || ''
    });
  } catch (e) {
    console.error('[draft] Draft generation error:', e.message, e.stack && e.stack.slice(0, 300));
    return res.status(500).json({ error: 'Draft generation failed' });
  }
};
