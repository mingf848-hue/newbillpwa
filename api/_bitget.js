import { createHmac } from 'node:crypto';

const BITGET_BASE_URL = process.env.BITGET_BASE_URL || 'https://api.bitget.com';

const ACCOUNT_TYPE_ALIASES = {
  all: 'all',
  total: 'all',
  overview: 'all',
  uta: 'uta',
  unified: 'uta',
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
  '统一账户': 'uta',
};

const OVERVIEW_ONLY_ACCOUNT_TYPES = new Set(['futures', 'earn', 'bots', 'margin']);
const DETACHED_CLASSIC_ACCOUNT_TYPES = new Set(['earn', 'funding', 'bots']);
const ACCOUNT_TYPE_LABELS = {
  uta: '统一账户',
  locked_spot: '锁仓',
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
const loadUtaAssets = () => signedBitgetGet('/api/v3/account/assets');
const loadSpotAllAssets = () => signedBitgetGet('/api/v2/spot/account/assets', { assetType: 'all' });
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

const normalizeUtaAccountAsset = (utaPayload) => {
  const data = utaPayload?.data || {};
  const usdtBalance = String(data.usdtEquity ?? data.accountEquity ?? '0');
  return {
    coin: 'UTA',
    accountType: 'uta',
    accountTypeLabel: ACCOUNT_TYPE_LABELS.uta,
    available: usdtBalance,
    frozen: '0',
    locked: '0',
    limitAvailable: '0',
    total: usdtBalance,
    usdtValue: usdtBalance,
    btcEquity: data.btcEquity || '',
    assets: Array.isArray(data.assets) ? data.assets : [],
  };
};

const sumUsdtValues = (assets) => assets.reduce((sum, asset) => sum + parseAmount(asset.usdtValue || asset.total), 0);

const loadLockedSpotAssets = async () => {
  const spotPayload = await loadSpotAllAssets();
  const rows = Array.isArray(spotPayload?.data) ? spotPayload.data : [];
  const lockedRows = rows
    .map((asset) => {
      const coin = String(asset?.coin || '').toUpperCase();
      const lockedAmount = parseAmount(asset?.locked) + parseAmount(asset?.frozen) + parseAmount(asset?.limitAvailable);
      return { coin, lockedAmount };
    })
    .filter((asset) => asset.coin && asset.coin !== 'USDT' && asset.lockedAmount > 0);

  const priceResults = await Promise.allSettled(lockedRows.map((asset) => loadSpotTicker(asset.coin)));
  const warnings = [];
  const assets = lockedRows.flatMap((asset, index) => {
    const priceResult = priceResults[index];
    if (priceResult.status === 'rejected') {
      warnings.push(`locked ${asset.coin} price failed: ${priceResult.reason?.message || priceResult.reason}`);
      return [];
    }
    const price = priceResult.value.price;
    const usdtValue = asset.lockedAmount * price;
    return [{
      coin: asset.coin,
      accountType: 'locked_spot',
      accountTypeLabel: `${asset.coin} 锁仓`,
      available: '0',
      frozen: '0',
      locked: formatAmount(asset.lockedAmount),
      limitAvailable: '0',
      total: formatAmount(asset.lockedAmount),
      usdtValue: formatAmount(usdtValue),
      price: formatAmount(price),
    }];
  });

  return { assets, warnings };
};

export const loadBitgetAssets = async ({ accountType = 'all', coin = '', assetType = 'hold_only' } = {}) => {
  const normalizedType = normalizeAccountType(accountType);

  if (normalizedType === 'all') {
    const [overviewResult, utaResult, lockedSpotResult] = await Promise.allSettled([
      loadOverview(),
      loadUtaAssets(),
      loadLockedSpotAssets(),
    ]);

    if (overviewResult.status === 'rejected' && utaResult.status === 'rejected') {
      throw overviewResult.reason;
    }

    const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : null;
    const overviewAssets = sortAssets((overview?.data || []).map(normalizeOverviewAsset));
    const classicTotal = sumUsdtValues(overviewAssets);
    const detachedAssets = overviewAssets.filter((asset) => DETACHED_CLASSIC_ACCOUNT_TYPES.has(asset.accountType) && parseAmount(asset.usdtValue) > 0);
    const lockedSpotAssets = lockedSpotResult.status === 'fulfilled' ? lockedSpotResult.value.assets : [];
    const lockedSpotWarnings = lockedSpotResult.status === 'fulfilled' ? lockedSpotResult.value.warnings : [];

    let assets = overviewAssets;
    let totalUsdt = classicTotal;
    let selectedSource = 'classic-overview';
    let utaTotal = 0;

    if (lockedSpotAssets.length > 0) {
      const classicPlusLockedAssets = sortAssets([...overviewAssets, ...lockedSpotAssets]);
      const classicPlusLockedTotal = sumUsdtValues(classicPlusLockedAssets);
      if (classicPlusLockedTotal > totalUsdt) {
        assets = classicPlusLockedAssets;
        totalUsdt = classicPlusLockedTotal;
        selectedSource = 'classic-plus-locked';
      }
    }

    if (utaResult.status === 'fulfilled') {
      const utaAsset = normalizeUtaAccountAsset(utaResult.value);
      utaTotal = parseAmount(utaAsset.usdtValue);
      const combinedAssets = sortAssets([utaAsset, ...detachedAssets, ...lockedSpotAssets]);
      const combinedTotal = sumUsdtValues(combinedAssets);
      if (combinedTotal > totalUsdt) {
        assets = combinedAssets;
        totalUsdt = combinedTotal;
        selectedSource = 'uta-plus-detached';
      }
    }

    return {
      success: true,
      source: 'bitget',
      accountType: normalizedType,
      totalUsdt: formatAmount(totalUsdt),
      assets,
      requestTime: overview?.requestTime || Date.now(),
      sources: {
        selected: selectedSource,
        classicOverviewUsdt: formatAmount(classicTotal),
        utaUsdt: formatAmount(utaTotal),
        detachedClassicUsdt: formatAmount(sumUsdtValues(detachedAssets)),
        lockedSpotUsdt: formatAmount(sumUsdtValues(lockedSpotAssets)),
      },
      warnings: [
        overviewResult.status === 'rejected' ? `classic overview failed: ${overviewResult.reason?.message || overviewResult.reason}` : '',
        utaResult.status === 'rejected' ? `UTA assets failed: ${utaResult.reason?.message || utaResult.reason}` : '',
        lockedSpotResult.status === 'rejected' ? `locked spot assets failed: ${lockedSpotResult.reason?.message || lockedSpotResult.reason}` : '',
        ...lockedSpotWarnings,
      ].filter(Boolean),
    };
  }

  if (normalizedType === 'uta') {
    const uta = await loadUtaAssets();
    const utaAsset = normalizeUtaAccountAsset(uta);
    return {
      success: true,
      source: 'bitget',
      accountType: normalizedType,
      totalUsdt: utaAsset.usdtValue,
      assets: [utaAsset],
      requestTime: uta?.requestTime || Date.now(),
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
