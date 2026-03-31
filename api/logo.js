// api/logo.js
// Proxies Brandfetch logo lookups server-side to keep API key secure

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { domain } = req.query;
  if (!domain) return res.status(400).json({ error: 'Missing domain' });

  try {
    const response = await fetch(`https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.BRANDFETCH_API_KEY}`,
      },
    });

    if (!response.ok) return res.status(200).json({ url: null });

    const data = await response.json();

    // Find the best logo -- prefer icon over logo, prefer PNG over SVG
    let url = null;
    const logos = data.logos || [];
    for (const logo of logos) {
      for (const format of (logo.formats || [])) {
        if (format.src && (format.format === 'png' || format.format === 'svg')) {
          url = format.src;
          if (format.format === 'png') break;
        }
      }
      if (url && url.endsWith('.png')) break;
    }

    return res.status(200).json({ url });
  } catch (e) {
    console.error('Brandfetch error:', e.message);
    return res.status(200).json({ url: null });
  }
};
