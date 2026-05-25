import { loadBitgetAssets } from './_bitget.js';
import { requestSupabase, parseAmount } from './_supabase.js';

const SNAPSHOT_PAYMENT_METHOD = '__balance_snapshot__';
const SNAPSHOT_NOTE_PREFIX = 'BALANCE_SNAPSHOT:';
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

const formatAmount = (value) => Number(value || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const getSnapshotDateParts = (dateKey) => {
  const match = String(dateKey || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
};

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

const parseStoredSnapshot = (transaction) => {
  try {
    const note = String(transaction?.note || '');
    if (!note.startsWith(SNAPSHOT_NOTE_PREFIX)) return null;
    const parsed = JSON.parse(note.slice(SNAPSHOT_NOTE_PREFIX.length));
    if (!parsed?.dateKey || !Number.isFinite(Number(parsed.totalCny))) return null;
    return {
      ...parsed,
      totalCny: Number(parsed.totalCny),
      transactionId: transaction.id,
    };
  } catch {
    return null;
  }
};

const readStoredSnapshots = async () => {
  const rows = await requestSupabase(`transactions?tagType=eq.snapshot&paymentMethod=eq.${encodeURIComponent(SNAPSHOT_PAYMENT_METHOD)}&select=*`);
  const snapshots = (Array.isArray(rows) ? rows : [])
    .map(parseStoredSnapshot)
    .filter(Boolean)
    .sort((a, b) => String(b.dateKey).localeCompare(String(a.dateKey)));

  return { rows: Array.isArray(rows) ? rows : [], snapshots };
};

const compactSnapshot = (snapshot) => ({
  id: snapshot.id,
  dateKey: snapshot.dateKey,
  monthKey: snapshot.monthKey,
  capturedAt: snapshot.capturedAt,
  currency: snapshot.currency,
  totalCny: snapshot.totalCny,
  accountCount: Array.isArray(snapshot.accounts) ? snapshot.accounts.length : Number(snapshot.accountCount || 0),
  rates: snapshot.rates,
  warnings: snapshot.warnings,
});

const snapshotToTransaction = (snapshot) => {
  const parts = getSnapshotDateParts(snapshot.dateKey);
  const year = parts?.year || new Date().getFullYear();
  const month = parts?.month || new Date().getMonth() + 1;
  const day = parts?.day || new Date().getDate();
  const compact = compactSnapshot(snapshot);

  return {
    dateLabel: `${month}月${day}日`,
    iconBg: 'bg-[#1677ff]',
    iconType: 'wallet',
    title: '余额快照',
    subtitle: '系统快照',
    tag: '资产快照',
    tagType: 'snapshot',
    amount: `+${formatAmount(snapshot.totalCny)}`,
    isIncome: true,
    time: '23:55',
    fullDate: `${year}年${month}月${day}日 23:55`,
    currency: 'CNY',
    paymentMethod: SNAPSHOT_PAYMENT_METHOD,
    note: `${SNAPSHOT_NOTE_PREFIX}${JSON.stringify(compact)}`,
  };
};

const writeStoredSnapshot = async (rows, snapshot) => {
  const existingRow = rows.find((row) => parseStoredSnapshot(row)?.dateKey === snapshot.dateKey);
  const payload = snapshotToTransaction(snapshot);

  if (existingRow?.id) {
    const [updated] = await requestSupabase(`transactions?id=eq.${encodeURIComponent(existingRow.id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return updated;
  }

  const [created] = await requestSupabase('transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return created;
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
  const { rows, snapshots } = await readStoredSnapshots();
  const nextSnapshot = await buildSnapshot();
  const storedRow = await writeStoredSnapshot(rows, nextSnapshot);
  const storedSnapshot = parseStoredSnapshot(storedRow) || compactSnapshot(nextSnapshot);
  const byDate = new Map(snapshots.map((snapshot) => [snapshot.dateKey, snapshot]));
  byDate.set(storedSnapshot.dateKey, storedSnapshot);
  const nextSnapshots = Array.from(byDate.values()).sort((a, b) => String(b.dateKey).localeCompare(String(a.dateKey)));

  return { snapshot: storedSnapshot, snapshots: nextSnapshots };
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
