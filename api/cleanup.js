// api/cleanup.js — one-time endpoint to delete specific lead keys from Redis

module.exports = async function handler(req, res) {
  if (req.headers['authorization'] !== 'Bearer ' + process.env.JOBS_CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  var keysToDelete = [
    'lead:2026-04-06:akkodis',
    'lead:2026-04-06:global-connect',
    'lead:2026-04-06:syms-strategic-ssg',
    'lead:2026-04-06:pentangle-tech-p5',
    'lead:2026-04-06:trane',
    'lead:2026-04-06:dematic',
    'lead:2026-04-02:pwc',
    'lead:2026-04-02:wade-trim',
    'lead:2026-04-02:veralto-global'
  ];

  var deleted = [];
  var failed = [];

  for (var i = 0; i < keysToDelete.length; i++) {
    var key = keysToDelete[i];
    try {
      var url = process.env.KV_REST_API_URL + '/del/' + encodeURIComponent(key);
      var res2 = await fetch(url, {
        headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN }
      });
      var data = await res2.json();
      if (data.result >= 1) {
        deleted.push(key);
      } else {
        failed.push({ key: key, reason: 'not found or already deleted' });
      }
    } catch (e) {
      failed.push({ key: key, reason: e.message });
    }
  }

  return res.status(200).json({ ok: true, deleted: deleted, failed: failed });
};
