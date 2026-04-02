// api/logo.js
// Returns a logo URL. Prefers Apollo logo_url if provided, falls back to Brandfetch CDN.

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');

  var apolloLogo = req.query.apollo_logo || '';
  if (apolloLogo && apolloLogo.indexOf('http') === 0) {
    return res.status(200).json({ url: apolloLogo });
  }

  var domain = req.query.domain;
  if (!domain) return res.status(400).json({ error: 'Missing domain' });

  var url = 'https://cdn.brandfetch.io/' + encodeURIComponent(domain) + '/w/128/h/128?c=' + process.env.BRANDFETCH_CLIENT_ID;
  return res.status(200).json({ url: url });
};
