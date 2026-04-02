// api/logo.js
// Accepts a domain query parameter and returns a Brandfetch CDN logo URL.

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');

  var domain = req.query.domain;
  if (!domain) return res.status(400).json({ error: 'Missing domain' });

  var url = 'https://cdn.brandfetch.io/' + encodeURIComponent(domain) + '/w/128/h/128?c=' + process.env.BRANDFETCH_CLIENT_ID;
  return res.status(200).json({ url: url });
};
