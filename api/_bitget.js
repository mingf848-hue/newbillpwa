import { createHmac } from 'node:crypto';

const BITGET_BASE_URL = process.env.BITGET_BASE_URL || 'https://api.bitget.com';

const ACCOUNT_TYPE_ALIASES = {
  all: 'all',
  total: 'all',
  overview: 'all',
  spot: 'spot',
  funding: 'funding',
  fund: 'funding',
  futures: 'futures',
  future: 'futures',
  earn: 'earn',
  bots: 'bots',
  bot: 'bots',
  margin: 'margin',
  '现货账户': 'spot',
  '资金账户': 'funding',
  '合约账户': 'futures',
  '理财账户': 'earn',
  '全部账户': 'all',
  '总资产': 'all',
};

const OVERVIEW_ONLY_ACCOUNT_TYPES = new Set(['futures', 'earn', 'bots', 'margin']);
const ACCOUNT_TYPE_LABELS = {
  spot: '现货',
  futures: '合约',
  funding: '资金',
  earn: '理财',
  bots: '策略',
  margin: '杠杆',
};

const getBitgetCredentials = () => {
  const apiKey = process.env.BITGET_API_KEY;
  const secretKey = process.env.BITGET_API_SECRET || process.env.BITGET_SECRET_KEY;
  const passphrase = process.env.BITGET_API_PASSPHRASE || process.env.BITGET_PASSPHRASE;

  if (!apiKey || !secretKey || !passphrase) {
    throw new Error('Missing Bitget API environment variables');
  }

  return { apiKey, secretKey, passphrase };
};

const normalizeAccountType = (value = 'spot') => {
  const raw = String(value || 'spot').trim();
  const normalized = ACCOUNT_TYPE_ALIASES[raw] || ACCOUNT_TYPE_ALIASES[raw.toLowerCase()];
  if (!normalized) {
    throw new Error(`Unsupported Bitget account type: ${raw}`);
  }
  return normalized;
};

const buildQueryString = (params = {}) => {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  const search = new URLSearchParams();
  entries.forEach(([key, value]) => search.append(key, String(value)));
  return search.toString();
};

export const signedBitgetGet = async (requestPath, params = {}) => {
  const { apiKey, secretKey, passphrase } = getBitgetCredentials();
  const method = 'GET';
  const body = '';
  const timestamp = String(Date.now());
  const queryString = buildQueryString(params);
  const pathWithQuery = `${requestPath}${queryString ? `?${queryString}` : ''}`;
  const prehash = `${timestamp}${method}${requestPath}${queryString ? `?${queryString}` : ''}${body}`;
  const signature = createHmac('sha256', secretKey).update(prehash).digest('base64');

  const response = await fetch(`${BITGET_BASE_URL}${pathWithQuery}`, {
    method,
    headers: {
      'ACCESS-KEY': apiKey,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-PASSPHRASE': passphrase,
      locale: 'en-US',
      'Content-Type': 'application/json',
    },
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(`Bitget request failed (${response.status}): ${text || response.statusText}`);
  }

  if (payload?.code && payload.code !== '00000') {
    throw new Error(payload.msg || payload.message || `Bitget API error: ${payload.code}`);
  }

  return payload;
};

const parseAmount = (value) => {
  const amount = Number(String(value ?? '0').replace(/,/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

const formatAmount = (value) => {
  if (!Number.isFinite(value)) return '0';
  return Number(value.toFixed(12)).toString();
};

const normalizeSpotAsset = (asset) => {
  const available = parseAmount(asset?.available);
  const frozen = parseAmount(asset?.frozen);
  const locked = parseAmount(asset?.locked);
  const total = available + frozen + locked;

  return {
    coin: String(asset?.coin || '').toUpperCase(),
    available: String(asset?.available ?? '0'),
    frozen: String(asset?.frozen ?? '0'),
    locked: String(asset?.locked ?? '0'),
    limitAvailable: String(asset?.limitAvailable ?? '0'),
    total: formatAmount(total),
    usdtValue: String(asset?.usdtValue ?? ''),
    uTime: asset?.uTime || null,
  };
};

const normalizeFundingAsset = (asset) => {
  const available = parseAmount(asset?.available);
  const frozen = parseAmount(asset?.frozen);
  const total = available + frozen;

  return {
    coin: String(asset?.coin || '').toUpperCase(),
    available: String(asset?.available ?? '0'),
    frozen: String(asset?.frozen ?? '0'),
    locked: '0',
    limitAvailable: '0',
    total: formatAmount(total),
    usdtValue: String(asset?.usdtValue ?? ''),
  };
};

const sortAssets = (assets) => assets
  .filter((asset) => asset.coin)
  .sort((a, b) => {
    if (a.coin === 'USDT') return -1;
    if (b.coin === 'USDT') return 1;
    return parseAmount(b.usdtValue || b.total) - parseAmount(a.usdtValue || a.total);
  });

const findOverviewBalance = (overviewPayload, accountType) => {
  const rows = Array.isArray(overviewPayload?.data) ? overviewPayload.data : [];
  const row = rows.find((item) => String(item?.accountType || '').toLowerCase() === accountType);
  return row?.usdtBalance !== undefined ? String(row.usdtBalance) : '';
};

const loadOverview = () => signedBitgetGet('/api/v2/account/all-account-balance');
const loadSpotAllAssets = () => signedBitgetGet('/api/v2/spot/account/assets', { assetType: 'all' });

const normalizeOverviewAsset = (row) => {
  const accountType = String(row?.accountType || '').toLowerCase();
  const usdtBalance = String(row?.usdtBalance ?? '0');
  return {
    coin: accountType.toUpperCase(),
    accountType,
    accountTypeLabel: ACCOUNT_TYPE_LABELS[accountType] || accountType,
    available: usdtBalance,
    frozen: '0',
    locked: '0',
    limitAvailable: '0',
    total: usdtBalance,
    usdtValue: usdtBalance,
  };
};

const sumUsdtValues = (assets) => assets.reduce((sum, asset) => sum + parseAmount(asset.usdtValue || asset.total), 0);

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TZ_OFFSET_HOURS = Number(process.env.TRANSACTION_TZ_OFFSET || 8);

const formatDateKey = (date) => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getBitgetEarnDateRange = ({ dateKey = '', daysAgo = 1, tzOffsetHours = DEFAULT_TZ_OFFSET_HOURS } = {}) => {
  const offsetMs = tzOffsetHours * 60 * 60 * 1000;
  let localStartUtcMs;
  let resolvedDateKey = dateKey;

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey))) {
    const [year, month, day] = dateKey.split('-').map(Number);
    localStartUtcMs = Date.UTC(year, month - 1, day) - offsetMs;
  } else {
    const localNow = new Date(Date.now() + offsetMs);
    const targetLocal = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()) - daysAgo * DAY_MS);
    resolvedDateKey = formatDateKey(targetLocal);
    localStartUtcMs = targetLocal.getTime() - offsetMs;
  }

  return {
    dateKey: resolvedDateKey,
    startTime: String(localStartUtcMs),
    endTime: String(localStartUtcMs + DAY_MS - 1),
    tzOffsetHours,
  };
};

const getResultList = (payload) => (
  Array.isArray(payload?.data?.resultList) ? payload.data.resultList : []
);

const normalizeEarnRecord = (record, source, queryType) => {
  const coin = String(record?.settleCoinName || record?.coinName || record?.coin || record?.productCoin || 'USDT').toUpperCase();
  const ts = Number(record?.ts || record?.cTime || record?.uTime || 0);
  return {
    id: String(record?.orderId || `${source}:${queryType}:${coin}:${ts}:${record?.amount || '0'}`),
    source,
    queryType,
    product: String(record?.product || record?.productType || record?.productLevel || ''),
    coin,
    amount: formatAmount(parseAmount(record?.amount)),
    amountNumber: parseAmount(record?.amount),
    timestamp: Number.isFinite(ts) ? ts : 0,
    raw: record,
  };
};

const fetchEarnRecordsPage = async ({ endpoint, params, source, queryType, idLessThan }) => {
  const payload = await signedBitgetGet(endpoint, {
    ...params,
    limit: 100,
    ...(idLessThan ? { idLessThan } : {}),
  });
  return {
    records: getResultList(payload).map((record) => normalizeEarnRecord(record, source, queryType)),
    endId: payload?.data?.endId ? String(payload.data.endId) : '',
    requestTime: payload?.requestTime || Date.now(),
  };
};

const fetchEarnRecords = async ({ endpoint, params, source, queryType, maxPages = 3 }) => {
  const records = [];
  let endId = '';
  let requestTime = Date.now();

  for (let page = 0; page < maxPages; page += 1) {
    const result = await fetchEarnRecordsPage({ endpoint, params, source, queryType, idLessThan: endId });
    records.push(...result.records);
    requestTime = result.requestTime;
    if (!result.endId || result.endId === endId || result.records.length === 0) break;
    endId = result.endId;
  }

  return { records, requestTime };
};

const groupEarnTotals = (records) => {
  const byCoin = new Map();
  records.forEach((record) => {
    if (!record.amountNumber) return;
    const current = byCoin.get(record.coin) || {
      coin: record.coin,
      amount: '0',
      amountNumber: 0,
      recordCount: 0,
      sources: [],
      latestTimestamp: 0,
    };
    current.amountNumber += record.amountNumber;
    current.amount = formatAmount(current.amountNumber);
    current.recordCount += 1;
    current.latestTimestamp = Math.max(current.latestTimestamp, record.timestamp || 0);
    if (!current.sources.includes(record.source)) current.sources.push(record.source);
    byCoin.set(record.coin, current);
  });
  return Array.from(byCoin.values()).sort((a, b) => b.amountNumber - a.amountNumber);
};

const dedupeEarnRecords = (records) => {
  const seen = new Set();
  return records.filter((record) => {
    const key = `${record.source}:${record.queryType}:${record.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const loadBitgetEarnIncome = async ({ startTime, endTime, coin = '', includeSharkfin = true } = {}) => {
  if (!startTime || !endTime) throw new Error('Missing Bitget Earn income date range');

  const tasks = [
    {
      endpoint: '/api/v2/earn/savings/records',
      params: { coin, periodType: 'flexible', orderType: 'pay_interest', startTime, endTime },
      source: 'savings',
      queryType: 'flexible',
    },
    {
      endpoint: '/api/v2/earn/savings/records',
      params: { coin, periodType: 'fixed', orderType: 'pay_interest', startTime, endTime },
      source: 'savings',
      queryType: 'fixed',
    },
  ];

  if (includeSharkfin) {
    tasks.push({
      endpoint: '/api/v2/earn/sharkfin/records',
      params: { coin, type: 'interest', startTime, endTime },
      source: 'sharkfin',
      queryType: 'interest',
    });
  }

  const results = await Promise.allSettled(tasks.map((task) => fetchEarnRecords(task)));
  const records = [];
  const warnings = [];
  let requestTime = Date.now();

  results.forEach((result, index) => {
    const task = tasks[index];
    if (result.status === 'fulfilled') {
      records.push(...result.value.records);
      requestTime = Math.max(requestTime, result.value.requestTime || 0);
      return;
    }
    warnings.push(`${task.source}:${task.queryType} ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
  });

  if (records.length === 0 && warnings.length === tasks.length) {
    throw new Error(warnings.join(' | '));
  }

  const dedupedRecords = dedupeEarnRecords(records);

  return {
    success: true,
    source: 'bitget',
    startTime,
    endTime,
    records: dedupedRecords,
    totals: groupEarnTotals(dedupedRecords),
    warnings,
    requestTime,
  };
};

export const loadBitgetEarnIncomeForDate = async ({ dateKey = '', daysAgo = 1, tzOffsetHours = DEFAULT_TZ_OFFSET_HOURS, coin = '', includeSharkfin = true } = {}) => {
  const range = getBitgetEarnDateRange({ dateKey, daysAgo, tzOffsetHours });
  const income = await loadBitgetEarnIncome({
    startTime: range.startTime,
    endTime: range.endTime,
    coin,
    includeSharkfin,
  });
  return { ...income, ...range };
};

export const loadBitgetAssets = async ({ accountType = 'all', coin = '', assetType = 'hold_only' } = {}) => {
  const normalizedType = normalizeAccountType(accountType);

  if (normalizedType === 'all') {
    const overview = await loadOverview();
    const assets = sortAssets((overview?.data || []).map(normalizeOverviewAsset));
    const totalUsdt = formatAmount(sumUsdtValues(assets));

    return {
      success: true,
      source: 'bitget',
      accountType: normalizedType,
      totalUsdt,
      assets,
      requestTime: overview?.requestTime || Date.now(),
      sources: {
        selected: 'all-account-balance',
        allAccountBalanceUsdt: totalUsdt,
      },
      warnings: [],
    };
  }

  if (OVERVIEW_ONLY_ACCOUNT_TYPES.has(normalizedType)) {
    const overview = await loadOverview();
    const totalUsdt = findOverviewBalance(overview, normalizedType);
    return {
      success: true,
      source: 'bitget',
      accountType: normalizedType,
      totalUsdt,
      assets: totalUsdt ? [{
        coin: 'USDT',
        available: totalUsdt,
        frozen: '0',
        locked: '0',
        limitAvailable: '0',
        total: totalUsdt,
        usdtValue: totalUsdt,
      }] : [],
      requestTime: overview?.requestTime || Date.now(),
    };
  }

  if (normalizedType === 'funding') {
    const [assetsResult, overviewResult] = await Promise.allSettled([
      signedBitgetGet('/api/v2/account/funding-assets', { coin }),
      loadOverview(),
    ]);

    if (assetsResult.status === 'rejected') throw assetsResult.reason;

    const assets = sortAssets((assetsResult.value?.data || []).map(normalizeFundingAsset));
    const overviewTotal = overviewResult.status === 'fulfilled' ? findOverviewBalance(overviewResult.value, 'funding') : '';
    const fallbackTotal = formatAmount(assets.reduce((sum, asset) => sum + parseAmount(asset.usdtValue || asset.total), 0));

    return {
      success: true,
      source: 'bitget',
      accountType: normalizedType,
      totalUsdt: overviewTotal || fallbackTotal,
      assets,
      requestTime: assetsResult.value?.requestTime || Date.now(),
    };
  }

  const [assetsResult, overviewResult] = await Promise.allSettled([
    signedBitgetGet('/api/v2/spot/account/assets', { coin, assetType }),
    loadOverview(),
  ]);

  if (assetsResult.status === 'rejected') throw assetsResult.reason;

  const assets = sortAssets((assetsResult.value?.data || []).map(normalizeSpotAsset));
  const overviewTotal = overviewResult.status === 'fulfilled' ? findOverviewBalance(overviewResult.value, 'spot') : '';
  const usdtAsset = assets.find((asset) => asset.coin === 'USDT');

  return {
    success: true,
    source: 'bitget',
    accountType: normalizedType,
    totalUsdt: overviewTotal || usdtAsset?.total || '0',
    assets,
    requestTime: assetsResult.value?.requestTime || Date.now(),
  };
};
