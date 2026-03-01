// /api/save-config
// Saves config to Vercel KV (instant, no redeploy needed)
// Setup: vercel.com → your project → Storage → Create KV Database → link it
// That's it. No other env vars needed.

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminPass = process.env.ADMIN_PASSWORD || 'nextgen2025';
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${adminPass}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { config, designs } = req.body || {};

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    return res.status(200).json({
      success: false,
      mode: 'no-kv',
      message: 'KV_NOT_CONFIGURED'
    });
  }

  try {
    const saves = [];
    if (config) {
      saves.push(fetch(`${KV_URL}/set/site_config`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: JSON.stringify(config) })
      }));
    }
    if (designs) {
      saves.push(fetch(`${KV_URL}/set/site_designs`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: JSON.stringify(designs) })
      }));
    }
    await Promise.all(saves);
    return res.status(200).json({ success: true, mode: 'kv' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
