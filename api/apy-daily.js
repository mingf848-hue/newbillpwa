import { loadBitgetEarnIncomeForDate } from './_bitget.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const TZ_OFFSET_HOURS = Number(process.env.TRANSACTION_TZ_OFFSET || 8);

const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const requestSupabase = async (endpoint, options = {}) => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.status === 204 ? null : response.json();
};

const parseAmount = (value) => {
  const amount = Number(String(value || '0').replace(/,/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

const formatAmount = (value) => value.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatDateKey = (date) => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey) => {
  const match = String(dateKey || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
};

const getPreviousLocalDateKey = (localNow) => {
  const previous = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()) - 24 * 60 * 60 * 1000);
  return formatDateKey(previous);
};

const parseApyConfigList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
};

const normalizeApyConfig = (config = {}, index = 0) => ({
  name: String(config.name || config.title || `活动 ${index + 1}`).trim() || `活动 ${index + 1}`,
  limit: String(config.limit ?? config.apy_limit ?? '0'),
  baseRate: String(config.baseRate ?? config.base_rate ?? config.apy_base_rate ?? '0'),
  overflowRate: String(config.overflowRate ?? config.overflow_rate ?? config.apy_overflow_rate ?? '0'),
});

const isActiveApyConfig = (config) => (
  parseAmount(config?.limit) > 0 ||
  parseAmount(config?.baseRate) > 0 ||
  parseAmount(config?.overflowRate) > 0
);

const getAccountApyConfigs = (account) => {
  const explicitConfigs = parseApyConfigList(account?.apy_configs);
  const configured = explicitConfigs.length > 0 ? explicitConfigs : parseApyConfigList(account?.apy_limit);
  if (configured.length > 0) {
    return configured.map(normalizeApyConfig).filter(isActiveApyConfig);
  }

  return [normalizeApyConfig({
    name: '默认活动',
    limit: account?.apy_limit || '0',
    baseRate: account?.apy_base_rate || '0',
    overflowRate: account?.apy_overflow_rate || '0',
  })].filter(isActiveApyConfig);
};

const getConfigDailyInterest = (balance, config) => {
  const limit = parseAmount(config.limit);
  const baseRate = parseAmount(config.baseRate) / 100;
  const overflowRate = parseAmount(config.overflowRate) / 100;
  const basePrincipal = limit > 0 ? Math.min(balance, limit) : balance;
  const overflowPrincipal = limit > 0 ? Math.max(0, balance - limit) : 0;
  return ((basePrincipal * baseRate) + (overflowPrincipal * overflowRate)) / 365;
};

const getDailyInterestBreakdown = (account) => {
  const balance = parseAmount(account.balance);
  const configs = getAccountApyConfigs(account).map((config) => ({
    ...config,
    dailyInterest: getConfigDailyInterest(balance, config),
  })).filter((config) => config.dailyInterest > 0);
  return {
    configs,
    total: configs.reduce((sum, config) => sum + config.dailyInterest, 0),
  };
};

const isRealtimeBalanceAccount = (account) => /bitget/i.test(`${account?.name || ''} ${account?.sub || ''} ${account?.icon || ''}`);

const inferPlatformMeta = (account) => {
  const source = `${account?.name || ''} ${account?.sub || ''} ${account?.icon || ''}`;
  if (/火币|HTX/i.test(source)) return { iconType: 'huobi', label: '火币' };
  if (/bitget/i.test(source)) return { iconType: 'bitget', label: 'Bitget' };
  if (/okx/i.test(source)) return { iconType: 'okx', label: 'OKX' };
  if (/binance|币安/i.test(source)) return { iconType: 'binance', label: '币安' };
  if (/bybit/i.test(source)) return { iconType: 'bybit', label: 'Bybit' };
  if (/gate\.?io/i.test(source)) return { iconType: 'gateio', label: 'Gate.io' };
  if (/kucoin/i.test(source)) return { iconType: 'kucoin', label: 'KuCoin' };
  if (/mexc/i.test(source)) return { iconType: 'mexc', label: 'MEXC' };
  return { iconType: account?.icon || 'landmark', label: account?.name || '理财账户' };
};

const findBitgetAccount = (accounts) => (
  accounts.find(isRealtimeBalanceAccount) ||
  accounts.find((account) => /bitget/i.test(`${account?.name || ''} ${account?.sub || ''} ${account?.icon || ''}`)) ||
  null
);

const createBitgetEarnTransactions = async (accounts, localNow) => {
  const dateKey = getPreviousLocalDateKey(localNow);
  const dateParts = parseDateKey(dateKey);
  if (!dateParts) return { processed: 0, created: 0, warnings: ['Invalid Bitget Earn date'] };

  let income;
  try {
    income = await loadBitgetEarnIncomeForDate({ dateKey, tzOffsetHours: TZ_OFFSET_HOURS });
  } catch (error) {
    return {
      processed: 0,
      created: 0,
      warnings: [error instanceof Error ? error.message : 'Bitget Earn income sync failed'],
    };
  }

  const bitgetAccount = findBitgetAccount(accounts);
  const paymentMethod = bitgetAccount?.name || 'Bitget';
  const created = [];

  for (const total of income.totals || []) {
    if (!total.amountNumber || total.amountNumber <= 0) continue;
    const currency = total.coin || 'USDT';
    const note = `BITGET_EARN_DAILY:${dateKey}:${currency}`;
    const existing = await requestSupabase(`transactions?paymentMethod=eq.${encodeURIComponent(paymentMethod)}&note=eq.${encodeURIComponent(note)}&select=id`);
    if (existing.length > 0) continue;

    const sourceLabel = total.sources?.includes('sharkfin') && total.sources?.includes('savings')
      ? 'Savings + SharkFin'
      : total.sources?.includes('sharkfin')
        ? 'SharkFin'
        : 'Savings';

    const [transaction] = await requestSupabase('transactions', {
      method: 'POST',
      body: JSON.stringify({
        dateLabel: `昨天 ${dateParts.month}月${dateParts.day}日`,
        iconBg: 'bg-[#00e5c0]',
        iconType: 'bitget',
        title: 'Bitget 昨日理财派息',
        subtitle: sourceLabel,
        tag: '理财',
        tagType: 'investment',
        amount: `+${formatAmount(total.amountNumber)}`,
        isIncome: true,
        time: '23:59',
        fullDate: `${dateParts.year}年${dateParts.month}月${dateParts.day}日 23:59`,
        currency,
        paymentMethod,
        note,
      }),
    });
    created.push(transaction);
  }

  return {
    processed: income.records?.length || 0,
    created: created.length,
    warnings: income.warnings || [],
    dateKey,
  };
};

export default async function handler(_req, res) {
  try {
    const userAgent = String(_req.headers?.['user-agent'] || '');
    const authorization = String(_req.headers?.authorization || '');
    const cronSecret = process.env.CRON_SECRET;
    const isVercelCron = userAgent.includes('vercel-cron/1.0');
    const hasCronSecret = cronSecret && authorization === `Bearer ${cronSecret}`;
    if (!isVercelCron && !hasCronSecret) {
      json(res, 401, { ok: false, error: 'Unauthorized cron request' });
      return;
    }

    const localNow = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const today = localNow.toISOString().slice(0, 10);
    const note = `APY每日派息:${today}`;
    const accounts = await requestSupabase('accounts?select=*');
    const eligibleAccounts = accounts
      .map((account) => ({ account, breakdown: getDailyInterestBreakdown(account) }))
      .filter(({ breakdown }) => breakdown.total > 0);
    const created = [];

    for (const { account, breakdown } of eligibleAccounts) {
      const existing = await requestSupabase(`transactions?paymentMethod=eq.${encodeURIComponent(account.name)}&note=eq.${encodeURIComponent(note)}&select=id`);
      if (existing.length > 0) continue;

      const interest = breakdown.total;
      const platformMeta = inferPlatformMeta(account);
      const payoutLabel = breakdown.configs.length > 1 ? '多活动理财派息' : '活期理财派息';
      const year = localNow.getUTCFullYear();
      const month = localNow.getUTCMonth() + 1;
      const day = localNow.getUTCDate();
      const hours = `${localNow.getUTCHours()}`.padStart(2, '0');
      const minutes = `${localNow.getUTCMinutes()}`.padStart(2, '0');

      const [transaction] = await requestSupabase('transactions', {
        method: 'POST',
        body: JSON.stringify({
          dateLabel: `今天 ${month}月${day}日`,
          iconBg: 'bg-[#10b981]',
          iconType: platformMeta.iconType,
          title: `${platformMeta.label} ${payoutLabel}`,
          subtitle: platformMeta.label,
          tag: '理财',
          tagType: 'investment',
          amount: `+${formatAmount(interest)}`,
          isIncome: true,
          time: `${hours}:${minutes}`,
          fullDate: `${year}年${month}月${day}日 ${hours}:${minutes}`,
          currency: account.currency || 'CNY',
          paymentMethod: account.name,
          note,
        }),
      });

      if (isRealtimeBalanceAccount(account)) {
        created.push(transaction);
        continue;
      }

      try {
        const nextBalance = parseAmount(account.balance) + interest;
        await requestSupabase(`accounts?id=eq.${encodeURIComponent(account.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ balance: formatAmount(nextBalance) }),
        });
      } catch (error) {
        await requestSupabase(`transactions?id=eq.${encodeURIComponent(transaction.id)}`, {
          method: 'DELETE',
        });
        throw error;
      }
      created.push(transaction);
    }

    const bitgetEarn = await createBitgetEarnTransactions(accounts, localNow);

    json(res, 200, {
      ok: true,
      processed: eligibleAccounts.length,
      created: created.length,
      bitgetEarn,
    });
  } catch (error) {
    json(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
