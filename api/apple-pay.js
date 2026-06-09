import { requestSupabase, parseAmount, formatAmount, formatTransactionDate, matchAccountByHint } from './_supabase.js';

const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const readWebhookPayload = (req) => {
  const queryPayload = req.query && typeof req.query === 'object' ? req.query : {};
  const body = req.body;
  if (!body) return queryPayload;
  if (typeof body === 'object' && !Buffer.isBuffer(body)) return { ...queryPayload, ...body };
  const text = Buffer.isBuffer(body) ? body.toString('utf8') : String(body);
  if (!text.trim()) return queryPayload;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') return { ...queryPayload, ...parsed };
  } catch {}
  try {
    return { ...queryPayload, ...Object.fromEntries(new URLSearchParams(text)) };
  } catch {
    return queryPayload;
  }
};

const readShortcutValue = (value) => {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return readShortcutValue(value[0]);
  if (typeof value === 'object') {
    const direct = value.value ?? value.text ?? value.name ?? value.string ?? value.amount;
    if (direct !== undefined && direct !== null) return readShortcutValue(direct);
    const primitive = Object.values(value).find((item) => ['string', 'number', 'boolean'].includes(typeof item));
    return primitive === undefined ? '' : String(primitive);
  }
  return String(value).trim();
};

const shouldSkipAutoBooking = (merchant) => /zed\s*mobility/i.test(String(merchant || ''));

const MERCHANT_RULES = [
  { match: /careem|uber|taxi|出租|打车|cars taxi|rta|metro|公交|parking|salik|nol/i, category: '交通', tagType: 'transport' },
  { match: /talabat|deliveroo|zomato|restaurant|cafe|coffee|starbucks|mcdonald|kfc|pizza|burger|餐|外卖|咖啡|餐厅/i, category: '餐饮', tagType: 'shopping' },
  { match: /carrefour|lulu|spinneys|waitrose|union\s*coop|supermarket|grocery|hypermarket|超市|便利店/i, category: '购物', tagType: 'shopping' },
  { match: /amazon|noon|ikea|mall|store|shop|shopping|淘宝|京东|购物|商店/i, category: '购物', tagType: 'shopping' },
  { match: /netflix|spotify|cinema|movie|game|steam|playstation|xbox|娱乐|电影|游戏/i, category: '娱乐', tagType: 'shopping' },
  { match: /school|university|course|tuition|education|book|kindle|学习|教育|课程|书/i, category: '教育', tagType: 'shopping' },
  { match: /pharmacy|hospital|clinic|medical|health|doctor|药|医院|医疗|诊所/i, category: '医疗', tagType: 'shopping' },
  { match: /dewa|utility|electric|water|rent|物业|房租|水电/i, category: '住房', tagType: 'shopping' },
  { match: /etisalat|\bdu\b|telecom|internet|maintenance|openai|apple(\.com| store| music| icloud| app store| itunes)|google|microsoft|adobe|github|notion|subscription|订阅|软件|宽带|话费/i, category: '家庭', tagType: 'shopping' },
];

const inferMerchantIcon = (merchant, fallback = 'apple') => {
  const source = String(merchant || '');
  if (/amazon/i.test(source)) return 'amazon';
  if (/noon/i.test(source)) return 'noon';
  if (/apple/i.test(source)) return 'apple';
  if (/openai/i.test(source)) return 'openai';
  if (/cash|现金/i.test(source)) return 'cash';
  return fallback;
};

const inferMerchantMeta = (merchant, { rideHour } = {}) => {
  const source = String(merchant || '');
  const matched = MERCHANT_RULES.find((rule) => rule.match.test(source));
  const isTaxi = /uber|taxi|出租|打车|cars taxi|careem/i.test(source);
  const isCommuteRide = isTaxi && Number.isFinite(rideHour);
  return {
    category: matched?.category || '其他',
    tagType: matched?.tagType || 'shopping',
    iconType: inferMerchantIcon(source),
    title: isCommuteRide ? (rideHour < 14 ? '打车上班' : '打车下班') : source,
    isCommuteRide,
  };
};

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    json(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const payload = readWebhookPayload(req);
    const secret = process.env.APPLE_PAY_WEBHOOK_KEY;
    const incomingKey = req.query?.key || req.headers?.['x-webhook-key'] || payload.key;
    if (secret && incomingKey !== secret) {
      json(res, 401, { error: 'Unauthorized' });
      return;
    }

    const merchant = readShortcutValue(payload.merchant ?? payload.title ?? payload.name);
    const amount = readShortcutValue(payload.amount ?? payload.money ?? payload.total);
    const account = readShortcutValue(payload.account ?? payload.accountHint ?? payload.paymentMethod);
    const card = readShortcutValue(payload.card);
    const currency = readShortcutValue(payload.currency) || undefined;
    const date = readShortcutValue(payload.date);
    const bodyTime = readShortcutValue(payload.time);
    const note = readShortcutValue(payload.note);
    const dryRun = ['1', 'true', 'yes'].includes(readShortcutValue(payload.dryRun).toLowerCase());
    const whenInput = date || bodyTime;
    const txAmount = Math.abs(parseAmount(amount));
    if (dryRun) {
      const formatted = formatTransactionDate(whenInput);
      const merchantMeta = inferMerchantMeta(merchant, { rideHour: formatted.hours });
      json(res, 200, {
        success: true,
        dryRun: true,
        receivedKeys: Object.keys(payload),
        parsed: { merchant, amount, txAmount, account, card, currency, date, time: bodyTime, note },
        inferred: merchantMeta,
        formattedTime: {
          dateLabel: formatted.dateLabel,
          fullDate: formatted.fullDate,
          time: formatted.time,
        },
      });
      return;
    }
    if (!merchant || !txAmount) {
      json(res, 400, {
        error: 'Missing merchant or amount',
        receivedKeys: Object.keys(payload),
        parsed: { merchant, amount, txAmount, account, card },
      });
      return;
    }
    if (shouldSkipAutoBooking(merchant)) {
      json(res, 200, {
        success: true,
        skipped: true,
        reason: 'Ride pre-authorization is excluded from auto booking',
        merchant,
        amount: txAmount,
      });
      return;
    }

    const accounts = await requestSupabase('accounts?select=*');
    const targetAccount = matchAccountByHint(accounts, account || card || 'Apple Pay');
    if (!targetAccount) {
      json(res, 400, { error: 'No available account found' });
      return;
    }

    const { dateLabel, fullDate, time, hours: rideHour } = formatTransactionDate(whenInput);
    const merchantMeta = inferMerchantMeta(merchant, { rideHour });
    const baseNote = note || `自动记账${card ? ` · ${card}` : ''}`;
    const finalNote = baseNote;

    const [transaction] = await requestSupabase('transactions', {
      method: 'POST',
      body: JSON.stringify({
        dateLabel,
        iconBg: 'bg-black',
        iconType: merchantMeta.iconType,
        title: merchantMeta.title || merchant,
        subtitle: targetAccount.name,
        tag: merchantMeta.category,
        tagType: merchantMeta.tagType,
        amount: `-${formatAmount(txAmount)}`,
        isIncome: false,
        time,
        fullDate,
        currency: currency || targetAccount.currency || 'CNY',
        paymentMethod: 'Apple Pay',
        note: finalNote,
      }),
    });

    try {
      const nextBalance = parseAmount(targetAccount.balance) - txAmount;
      await requestSupabase(`accounts?id=eq.${encodeURIComponent(targetAccount.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ balance: formatAmount(nextBalance) }),
      });
    } catch (error) {
      await requestSupabase(`transactions?id=eq.${encodeURIComponent(transaction.id)}`, {
        method: 'DELETE',
      });
      throw error;
    }

    json(res, 200, {
      success: true,
      matchedAccount: targetAccount.name,
      transactionId: transaction?.id,
    });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
