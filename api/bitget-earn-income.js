import { loadBitgetEarnIncomeForDate } from './_bitget.js';

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

const normalizeBitgetError = (message) => {
  if (/40014|permission|permissions|unauthorized|access/i.test(message)) {
    return 'Bitget API 权限不足：请在 Bitget API Key 权限里开启 Earn/理财读取权限后重试。';
  }
  return message;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const result = await loadBitgetEarnIncomeForDate({
      dateKey: readQuery(req, 'date'),
      daysAgo: Number(readQuery(req, 'daysAgo') || 1),
      coin: readQuery(req, 'coin'),
      includeSharkfin: readQuery(req, 'includeSharkfin') !== 'false',
    });

    json(res, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Bitget Earn API error';
    json(res, 502, { success: false, error: normalizeBitgetError(message), rawError: message });
  }
}
