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

const signedBitgetGet = async (requestPath, params = {}) => {
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

const publicBitgetGet = async (requestPath, params = {}) => {
  const queryString = buildQueryString(params);
  const pathWithQuery = `${requestPath}${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(`${BITGET_BASE_URL}${pathWithQuery}`, {
    headers: {
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
    throw new Error(`Bitget public request failed (${response.status}): ${text || response.statusText}`);
  }
  if (payload?.code && payload.code !== '00000') {
    throw new Error(payload.msg || payload.message || `Bitget public API error: ${payload.code}`);
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
const loadSavingsAssets = (periodType) => signedBitgetGet('/api/v2/earn/savings/assets', { periodType, limit: 100 });
const loadSpotTicker = (coin) => {
  const normalizedCoin = String(coin || '').toUpperCase();
  if (!normalizedCoin || normalizedCoin === 'USDT') return Promise.resolve({ coin: normalizedCoin, price: 1 });
  return publicBitgetGet('/api/v2/spot/market/tickers', { symbol: `${normalizedCoin}USDT` }).then((payload) => {
    const ticker = Array.isArray(payload?.data) ? payload.data[0] : null;
    const price = parseAmount(ticker?.lastPr || ticker?.bidPr || ticker?.askPr);
    if (!price) throw new Error(`No USDT ticker for ${normalizedCoin}`);
    return { coin: normalizedCoin, price };
  });
};

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

const normalizeSavingsAsset = (asset) => {
  const coin = String(asset?.productCoin || asset?.interestCoin || asset?.coin || '').toUpperCase();
  const total = parseAmount(asset?.holdAmount ?? asset?.amount ?? asset?.totalAmount ?? asset?.total);
  return {
    coin,
    available: '0',
    frozen: '0',
    locked: formatAmount(total),
    limitAvailable: '0',
    total: formatAmount(total),
    usdtValue: String(asset?.usdtValue ?? asset?.usdtAmount ?? ''),
    accountType: 'earn_asset',
    accountTypeLabel: `${coin} 理财`,
  };
};

const valueAssets = async (rawAssets) => {
  const baseAssets = sortAssets(rawAssets.filter((asset) => asset.coin && parseAmount(asset.total) > 0));
  const priceResults = await Promise.allSettled(baseAssets.map((asset) => loadSpotTicker(asset.coin)));
  const warnings = [];
  const assets = baseAssets.flatMap((asset, index) => {
    const priceResult = priceResults[index];
    if (priceResult.status === 'rejected') {
      warnings.push(`${asset.coin} price failed: ${priceResult.reason?.message || priceResult.reason}`);
      return [];
    }
    const directUsdtValue = parseAmount(asset.usdtValue);
    const total = parseAmount(asset.total);
    const price = directUsdtValue > 0 && total > 0 ? directUsdtValue / total : priceResult.value.price;
    const usdtValue = directUsdtValue > 0 ? directUsdtValue : total * price;
    return [{
      ...asset,
      accountType: 'asset',
      accountTypeLabel: asset.coin,
      price: formatAmount(price),
      usdtValue: formatAmount(usdtValue),
    }];
  });

  return { assets: sortAssets(assets), warnings };
};

const mergeAssetsByCoinMaxValue = (assets) => {
  const byCoin = new Map();
  assets.forEach((asset) => {
    const current = byCoin.get(asset.coin);
    if (!current || parseAmount(asset.usdtValue) > parseAmount(current.usdtValue)) {
      byCoin.set(asset.coin, asset);
    }
  });
  return sortAssets(Array.from(byCoin.values()));
};

const loadValuedVisibleAssets = async () => {
  const [spotResult, flexibleResult, fixedResult] = await Promise.allSettled([
    loadSpotAllAssets(),
    loadSavingsAssets('flexible'),
    loadSavingsAssets('fixed'),
  ]);
  if (spotResult.status === 'rejected') throw spotResult.reason;

  const warnings = [
    flexibleResult.status === 'rejected' ? `flexible earn assets failed: ${flexibleResult.reason?.message || flexibleResult.reason}` : '',
    fixedResult.status === 'rejected' ? `fixed earn assets failed: ${fixedResult.reason?.message || fixedResult.reason}` : '',
  ].filter(Boolean);
  const spotRows = Array.isArray(spotResult.value?.data) ? spotResult.value.data : [];
  const flexibleRows = flexibleResult.status === 'fulfilled' && Array.isArray(flexibleResult.value?.data?.resultList) ? flexibleResult.value.data.resultList : [];
  const fixedRows = fixedResult.status === 'fulfilled' && Array.isArray(fixedResult.value?.data?.resultList) ? fixedResult.value.data.resultList : [];
  const rawAssets = [
    ...spotRows.map(normalizeSpotAsset),
    ...flexibleRows.map(normalizeSavingsAsset),
    ...fixedRows.map(normalizeSavingsAsset),
  ];
  const valued = await valueAssets(rawAssets);
  const assets = mergeAssetsByCoinMaxValue(valued.assets);

  return {
    assets,
    totalUsdt: formatAmount(sumUsdtValues(assets)),
    requestTime: spotResult.value?.requestTime || Date.now(),
    warnings: [...warnings, ...valued.warnings],
  };
};

export const loadBitgetAssets = async ({ accountType = 'all', coin = '', assetType = 'hold_only' } = {}) => {
  const normalizedType = normalizeAccountType(accountType);

  if (normalizedType === 'all') {
    const visibleValuation = await loadValuedVisibleAssets();

    return {
      success: true,
      source: 'bitget',
      accountType: normalizedType,
      totalUsdt: visibleValuation.totalUsdt,
      assets: visibleValuation.assets,
      requestTime: visibleValuation.requestTime,
      sources: {
        selected: 'visible-assets-valuation',
        visibleAssetsUsdt: visibleValuation.totalUsdt,
      },
      warnings: visibleValuation.warnings,
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
