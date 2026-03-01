// /api/get-config
// Reads live config from Vercel KV, falls back to static JSON files

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (KV_URL && KV_TOKEN) {
    try {
      const [cfgRes, dsnRes] = await Promise.all([
        fetch(`${KV_URL}/get/site_config`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } }),
        fetch(`${KV_URL}/get/site_designs`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } })
      ]);

      const cfgData = await cfgRes.json();
      const dsnData = await dsnRes.json();

      const config = cfgData.result ? JSON.parse(cfgData.result) : null;
      const designs = dsnData.result ? JSON.parse(dsnData.result) : null;

      // If KV has data, return it
      if (config || designs) {
        // Merge with static files as fallback for missing keys
        const staticCfg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'site-config.json'), 'utf8'));
        const staticDsn = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'designs.json'), 'utf8'));
        return res.status(200).json({
          config: config || staticCfg,
          designs: designs || staticDsn,
          source: 'kv'
        });
      }
    } catch (e) {
      console.error('KV read error:', e.message);
    }
  }

  // Fallback to static files
  try {
    const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'site-config.json'), 'utf8'));
    const designs = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'designs.json'), 'utf8'));
    return res.status(200).json({ config, designs, source: 'static' });
  } catch (e) {
    return res.status(500).json({ error: 'Could not load config' });
  }
};
