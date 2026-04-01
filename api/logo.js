// api/logo.js
// Returns a Brandfetch CDN URL for the given domain — no API key needed.
// The browser loads the image directly; img onerror handles missing logos.

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');

  var domain = req.query.domain;
  if (!domain) return res.status(400).json({ error: 'Missing domain' });

  var url = 'https://cdn.brandfetch.io/' + encodeURIComponent(domain) + '/w/128/h/128';
  return res.status(200).json({ url: url });
};
