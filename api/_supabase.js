const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export const requestSupabase = async (endpoint, options = {}) => {
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

export const parseAmount = (value) => {
  const amount = Number(String(value || '0').replace(/,/g, '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

export const formatAmount = (value) => value.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DEFAULT_TRANSACTION_TZ_OFFSET_HOURS = Number(process.env.TRANSACTION_TZ_OFFSET || 8);

const fromOffsetDate = (dateInput) => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput || Date.now());
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const localDate = new Date(safeDate.getTime() + DEFAULT_TRANSACTION_TZ_OFFSET_HOURS * 60 * 60 * 1000);

  return {
    year: localDate.getUTCFullYear(),
    month: localDate.getUTCMonth() + 1,
    day: localDate.getUTCDate(),
    hours: localDate.getUTCHours(),
    minutes: localDate.getUTCMinutes(),
  };
};

const buildWallClock = (year, month, day, hours = 0, minutes = 0) => ({
  year: Number(year),
  month: Number(month),
  day: Number(day),
  hours: Number(hours),
  minutes: Number(minutes),
});

// Extract the wall-clock components the caller actually sent. An ISO string
// like "2026-09-09T09:41:00+04:00" is read as 09:41 regardless of the
// timezone offset, so the recorded time matches the phone clock. If the caller
// sends no time, use UTC+8 by default instead of the server timezone.
export const parseWallClock = (input) => {
  if (typeof input === 'string') {
    const value = input.trim();
    const iso = value.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T\s](\d{1,2}):(\d{2})/);
    if (iso) {
      return buildWallClock(iso[1], iso[2], iso[3], iso[4], iso[5]);
    }

    const chinese = value.match(/(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*(\d{1,2}):(\d{2}))?/);
    if (chinese) {
      return buildWallClock(chinese[1], chinese[2], chinese[3], chinese[4] || 0, chinese[5] || 0);
    }

    const slashYearFirst = value.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:\D+(\d{1,2}):(\d{2}))?/);
    if (slashYearFirst) {
      return buildWallClock(slashYearFirst[1], slashYearFirst[2], slashYearFirst[3], slashYearFirst[4] || 0, slashYearFirst[5] || 0);
    }

    const slashYearLast = value.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\D+(\d{1,2}):(\d{2}))?/);
    if (slashYearLast) {
      const first = Number(slashYearLast[1]);
      const second = Number(slashYearLast[2]);
      const isDayFirst = first > 12;
      return buildWallClock(
        slashYearLast[3],
        isDayFirst ? second : first,
        isDayFirst ? first : second,
        slashYearLast[4] || 0,
        slashYearLast[5] || 0
      );
    }
  }

  return fromOffsetDate(input);
};

export const formatTransactionDate = (dateInput) => {
  const { year, month, day, hours, minutes } = parseWallClock(dateInput);
  const hh = `${hours}`.padStart(2, '0');
  const mm = `${minutes}`.padStart(2, '0');
  return {
    year,
    month,
    day,
    hours,
    minutes,
    dateLabel: `今天 ${month}月${day}日`,
    fullDate: `${year}年${month}月${day}日 ${hh}:${mm}`,
    time: `${hh}:${mm}`,
  };
};

export const matchAccountByHint = (accounts, hint = '') => {
  if (!Array.isArray(accounts) || accounts.length === 0) return null;
  const text = String(hint || '').trim().toLowerCase();
  if (!text) return accounts[0];

  const direct = accounts.find((account) => {
    const source = `${account?.name || ''} ${account?.sub || ''} ${account?.icon || ''} ${account?.type || ''}`.toLowerCase();
    return source.includes(text) || text.includes(String(account?.name || '').toLowerCase());
  });
  if (direct) return direct;

  if (/(apple pay|card|visa|master|bank|银行卡|银行|mashreq|adcb)/i.test(text)) {
    return accounts.find((account) => account?.type === 'bank' || /bank|银行|mashreq|adcb/i.test(`${account?.name || ''} ${account?.sub || ''}`)) || accounts[0];
  }
  if (/(alipay|支付宝)/i.test(text)) {
    return accounts.find((account) => /alipay|支付宝/i.test(`${account?.name || ''} ${account?.sub || ''}`)) || accounts[0];
  }
  if (/(wechat|微信)/i.test(text)) {
    return accounts.find((account) => /wechat|微信/i.test(`${account?.name || ''} ${account?.sub || ''}`)) || accounts[0];
  }
  if (/(okx|bitget|htx|火币|binance|币安|bybit|gate|kucoin|mexc)/i.test(text)) {
    return accounts.find((account) => account?.type === 'exchange' && text.includes(String(account?.name || '').toLowerCase().split(' ')[0])) || accounts.find((account) => account?.type === 'exchange') || accounts[0];
  }
  if (/(cash|现金)/i.test(text)) {
    return accounts.find((account) => account?.type === 'cash' || /现金|cash/i.test(`${account?.name || ''} ${account?.sub || ''}`)) || accounts[0];
  }

  return accounts[0];
};
