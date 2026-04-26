const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

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

const getDailyInterest = (account) => {
  const balance = parseAmount(account.balance);
  const limit = parseAmount(account.apy_limit);
  const baseRate = parseAmount(account.apy_base_rate) / 100;
  const overflowRate = parseAmount(account.apy_overflow_rate) / 100;
  const basePrincipal = limit > 0 ? Math.min(balance, limit) : balance;
  const overflowPrincipal = limit > 0 ? Math.max(0, balance - limit) : 0;
  return ((basePrincipal * baseRate) + (overflowPrincipal * overflowRate)) / 365;
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
    const eligibleAccounts = accounts.filter((account) => getDailyInterest(account) > 0);
    const created = [];

    for (const account of eligibleAccounts) {
      const existing = await requestSupabase(`transactions?paymentMethod=eq.${encodeURIComponent(account.name)}&note=eq.${encodeURIComponent(note)}&select=id`);
      if (existing.length > 0) continue;

      const interest = getDailyInterest(account);
      const nextBalance = parseAmount(account.balance) + interest;
      const year = localNow.getUTCFullYear();
      const month = localNow.getUTCMonth() + 1;
      const day = localNow.getUTCDate();
      const hours = `${localNow.getUTCHours()}`.padStart(2, '0');
      const minutes = `${localNow.getUTCMinutes()}`.padStart(2, '0');

      await requestSupabase(`accounts?id=eq.${encodeURIComponent(account.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ balance: formatAmount(nextBalance) }),
      });

      const [transaction] = await requestSupabase('transactions', {
        method: 'POST',
        body: JSON.stringify({
          dateLabel: `今天 ${month}月${day}日`,
          iconBg: 'bg-[#10b981]',
          iconType: account.icon || 'landmark',
          title: `${account.name} APY 派息`,
          subtitle: account.name,
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
      created.push(transaction);
    }

    json(res, 200, { ok: true, processed: eligibleAccounts.length, created: created.length });
  } catch (error) {
    json(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
