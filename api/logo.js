// api/logo.js
// Uses Gemini to resolve a company name to its domain, then returns a Brandfetch CDN URL.
// Falls back to the passed domain if Gemini fails.

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');

  var domain = req.query.domain;
  if (!domain) return res.status(400).json({ error: 'Missing domain' });

  var company = req.query.company;
  var location = req.query.location || '';

  if (company && process.env.GEMINI_API_KEY) {
    try {
      var prompt = 'What is the official website domain for this company? Company: ' + company;
      if (location) prompt += ', Location: ' + location;
      prompt += '. Reply with only the domain name like example.com, nothing else.';

      var geminiRes = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + process.env.GEMINI_API_KEY,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (geminiRes.ok) {
        var data = await geminiRes.json();
        var text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
        if (text) {
          var cleaned = text.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
          if (cleaned && cleaned.includes('.')) {
            domain = cleaned;
          }
        }
      }
    } catch (e) {
      console.error('Gemini lookup error:', e.message);
    }
  }

  var url = 'https://cdn.brandfetch.io/' + encodeURIComponent(domain) + '/w/128/h/128?c=' + process.env.BRANDFETCH_CLIENT_ID;
  return res.status(200).json({ url: url });
};
