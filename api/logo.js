// api/logo.js
// Uses Google Custom Search to resolve a company name to its website domain and LinkedIn page.
// Returns a Brandfetch CDN logo URL, website URL, and LinkedIn URL.
// Falls back to Gemini for domain if Google API fails.

var excludedDomains = [
  'linkedin.com', 'indeed.com', 'glassdoor.com', 'ziprecruiter.com',
  'monster.com', 'careerbuilder.com', 'facebook.com', 'twitter.com', 'yelp.com'
];

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');

  var domain = req.query.domain;
  if (!domain) return res.status(400).json({ error: 'Missing domain' });

  var company = req.query.company;
  var location = req.query.location || '';
  var websiteUrl = null;
  var linkedinUrl = null;

  if (company && process.env.GOOGLE_API_KEY && process.env.GOOGLE_CSE_ID) {
    var searchQuery = company + (location ? ' ' + location : '');
    var baseUrl = 'https://www.googleapis.com/customsearch/v1?key=' + process.env.GOOGLE_API_KEY + '&cx=' + process.env.GOOGLE_CSE_ID + '&num=5';

    try {
      // First call: find company website
      var webRes = await fetch(baseUrl + '&q=' + encodeURIComponent(searchQuery + ' official website'));
      if (webRes.ok) {
        var webData = await webRes.json();
        var items = webData.items || [];
        for (var i = 0; i < items.length; i++) {
          try {
            var hostname = new URL(items[i].link).hostname.replace('www.', '');
            var excluded = false;
            for (var j = 0; j < excludedDomains.length; j++) {
              if (hostname.indexOf(excludedDomains[j]) !== -1) { excluded = true; break; }
            }
            if (!excluded) {
              domain = hostname;
              websiteUrl = 'https://' + hostname;
              break;
            }
          } catch (e) { /* skip bad URLs */ }
        }
      }

      // Second call: find LinkedIn company page
      var liRes = await fetch(baseUrl + '&q=' + encodeURIComponent(searchQuery + ' LinkedIn company page'));
      if (liRes.ok) {
        var liData = await liRes.json();
        var liItems = liData.items || [];
        for (var k = 0; k < liItems.length; k++) {
          if (liItems[k].link && liItems[k].link.indexOf('linkedin.com/company/') !== -1) {
            linkedinUrl = liItems[k].link;
            break;
          }
        }
      }
      if (!linkedinUrl) {
        linkedinUrl = 'https://www.linkedin.com/search/results/companies/?keywords=' + encodeURIComponent(company);
      }
    } catch (e) {
      console.error('Google CSE error:', e.message);
      // Fall back to Gemini
      linkedinUrl = null;
      await geminiLookup();
    }
  } else if (company && process.env.GEMINI_API_KEY) {
    await geminiLookup();
  }

  var url = 'https://cdn.brandfetch.io/' + encodeURIComponent(domain) + '/w/128/h/128?c=' + process.env.BRANDFETCH_CLIENT_ID;
  return res.status(200).json({ url: url, websiteUrl: websiteUrl, linkedinUrl: linkedinUrl });

  async function geminiLookup() {
    try {
      var prompt = 'What is the official public website domain for this company? Company name: ' + company;
      if (location) prompt += ', Location: ' + location;
      prompt += '. Return only the root domain like \'example.com\'. Do not guess or construct a domain from the company name -- only return a domain you are confident is correct. If you are not confident, return the company name in lowercase with no spaces and .com appended.';

      var geminiRes = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + process.env.GEMINI_API_KEY,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 50 }
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
            websiteUrl = 'https://' + cleaned;
          }
        }
      }
    } catch (e) {
      console.error('Gemini lookup error:', e.message);
    }
  }
};
