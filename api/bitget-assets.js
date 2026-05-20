import { loadBitgetAssets } from './_bitget.js';

const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const readQuery = (req, key) => {
  const direct = req.query?.[key];
  if (Array.isArray(direct)) return direct[0];
  if (direct !== undefined) return direct;

  const url = new URL(req.url || '/', 'http://localhost');
  return url.searchParams.get(key) || '';
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const result = await loadBitgetAssets({
      accountType: readQuery(req, 'accountType') || 'all',
      coin: readQuery(req, 'coin'),
      assetType: readQuery(req, 'assetType') || 'hold_only',
    });

    json(res, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Bitget API error';
    const statusCode = message.startsWith('Unsupported') ? 400 : 502;
    json(res, statusCode, { success: false, error: message });
  }
}
