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

// Extract the wall-clock components the caller actually sent. An ISO string
// like "2026-09-09T09:41:00+04:00" is read as 09:41 regardless of the
// timezone offset, so the recorded time matches the user's local clock even
// though the server runs in UTC.
export const parseWallClock = (input) => {
  if (typeof input === 'string') {
    const m = input.match(/(\d{4})-(\d{1,2})-(\d{1,2})[T\s](\d{1,2}):(\d{2})/);
    if (m) {
      return { year: +m[1], month: +m[2], day: +m[3], hours: +m[4], minutes: +m[5] };
    }
  }
  const d = input ? new Date(input) : new Date();
  const safe = Number.isNaN(d.getTime()) ? new Date() : d;
  return {
    year: safe.getFullYear(),
    month: safe.getMonth() + 1,
    day: safe.getDate(),
    hours: safe.getHours(),
    minutes: safe.getMinutes(),
  };
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
