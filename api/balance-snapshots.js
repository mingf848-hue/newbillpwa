import { loadBitgetAssets } from './_bitget.js';
import { requestSupabase, parseAmount } from './_supabase.js';

const SETTINGS_KEY = 'balance_snapshots';
const SNAPSHOT_TZ_OFFSET_HOURS = Number(process.env.BALANCE_SNAPSHOT_TZ_OFFSET || 8);
const FALLBACK_RATES = {
  CNY: 1,
  USDT: 7.25,
  AED: 1.97,
  BTC: 470000,
  ETH: 24000,
};

const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const getLocalDateKey = (date = new Date()) => {
  const localDate = new Date(date.getTime() + SNAPSHOT_TZ_OFFSET_HOURS * 60 * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
};

const getMonthKey = (dateKey) => dateKey.slice(0, 7);

const isRealtimeBalanceAccount = (account) => /bitget/i.test(`${account?.name || ''} ${account?.sub || ''} ${account?.icon || ''}`);

const fetchRates = async () => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,bitcoin,ethereum&vs_currencies=cny,aed', {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return FALLBACK_RATES;

    const data = await response.json();
    const tetherCny = Number(data?.tether?.cny || 0);
    const tetherAed = Number(data?.tether?.aed || 0);
    return {
      CNY: 1,
      USDT: tetherCny || FALLBACK_RATES.USDT,
      AED: tetherCny && tetherAed ? tetherCny / tetherAed : FALLBACK_RATES.AED,
      BTC: Number(data?.bitcoin?.cny || 0) || FALLBACK_RATES.BTC,
      ETH: Number(data?.ethereum?.cny || 0) || FALLBACK_RATES.ETH,
    };
  } catch {
    return FALLBACK_RATES;
  }
};

const convertToCny = (amount, currency, rates) => {
  const normalized = String(currency || 'CNY').trim().toUpperCase();
  const rate = rates[normalized] ?? (normalized === 'CNY' ? 1 : 0);
  return parseAmount(amount) * rate;
};

const readStoredSnapshots = async () => {
  const rows = await requestSupabase(`settings?key=eq.${encodeURIComponent(SETTINGS_KEY)}&select=*`);
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row?.value) return { row, snapshots: [] };

  try {
    const parsed = JSON.parse(row.value);
    const snapshots = Array.isArray(parsed) ? parsed : parsed?.snapshots;
    return { row, snapshots: Array.isArray(snapshots) ? snapshots : [] };
  } catch {
    return { row, snapshots: [] };
  }
};

const writeStoredSnapshots = async (row, snapshots) => {
  const value = JSON.stringify({ version: 1, snapshots });
  if (row?.key) {
    await requestSupabase(`settings?key=eq.${encodeURIComponent(SETTINGS_KEY)}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    });
    return;
  }

  await requestSupabase('settings', {
    method: 'POST',
    body: JSON.stringify({ key: SETTINGS_KEY, value }),
  });
};

const buildSnapshot = async () => {
  const warnings = [];
  const [accountsResult, rates] = await Promise.all([
    requestSupabase('accounts?select=*'),
    fetchRates(),
  ]);
  const accounts = Array.isArray(accountsResult) ? accountsResult : [];

  let bitgetTotalUsdt = '';
  try {
    const bitget = await loadBitgetAssets({ accountType: 'all' });
    bitgetTotalUsdt = bitget?.totalUsdt || '';
  } catch (error) {
    if (accounts.some(isRealtimeBalanceAccount)) {
      warnings.push(error instanceof Error ? error.message : 'Bitget live balance unavailable');
    }
  }

  const snapshotAccounts = accounts.map((account) => {
    const useLiveBitget = bitgetTotalUsdt && isRealtimeBalanceAccount(account);
    const currency = useLiveBitget ? 'USDT' : (account.currency || 'CNY');
    const balance = useLiveBitget ? parseAmount(bitgetTotalUsdt) : parseAmount(account.balance);
    const balanceCny = roundMoney(convertToCny(balance, currency, rates));
    return {
      id: account.id,
      name: account.name || '',
      type: account.type || '',
      currency,
      balance,
      balanceCny,
      realtime: Boolean(useLiveBitget),
    };
  });

  const dateKey = getLocalDateKey();
  const totalCny = roundMoney(snapshotAccounts.reduce((sum, account) => sum + account.balanceCny, 0));

  return {
    id: `${dateKey}-daily`,
    dateKey,
    monthKey: getMonthKey(dateKey),
    capturedAt: new Date().toISOString(),
    currency: 'CNY',
    totalCny,
    accounts: snapshotAccounts,
    rates,
    warnings,
  };
};

const captureSnapshot = async () => {
  const { row, snapshots } = await readStoredSnapshots();
  const nextSnapshot = await buildSnapshot();
  const byDate = new Map();

  snapshots.forEach((snapshot) => {
    if (snapshot?.dateKey) byDate.set(snapshot.dateKey, snapshot);
  });
  byDate.set(nextSnapshot.dateKey, nextSnapshot);

  const nextSnapshots = Array.from(byDate.values())
    .filter((snapshot) => snapshot?.dateKey)
    .sort((a, b) => String(b.dateKey).localeCompare(String(a.dateKey)))
    .slice(0, 500);

  await writeStoredSnapshots(row, nextSnapshots);
  return { snapshot: nextSnapshot, snapshots: nextSnapshots };
};

export default async function handler(req, res) {
  try {
    const userAgent = String(req.headers?.['user-agent'] || '');
    const isVercelCron = userAgent.includes('vercel-cron/1.0');
    const url = new URL(req.url || '/', 'http://localhost');
    const wantsCapture = req.method === 'POST' || isVercelCron || url.searchParams.get('capture') === '1';

    if (req.method !== 'GET' && req.method !== 'POST') {
      json(res, 405, { success: false, error: 'Method Not Allowed' });
      return;
    }

    if (wantsCapture) {
      const result = await captureSnapshot();
      json(res, 200, { success: true, ...result });
      return;
    }

    const { snapshots } = await readStoredSnapshots();
    json(res, 200, { success: true, snapshots });
  } catch (error) {
    json(res, 500, { success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
