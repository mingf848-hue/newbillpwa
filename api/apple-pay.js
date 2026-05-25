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

const shouldSkipAutoBooking = (merchant) => /careem|zed\s*mobility/i.test(String(merchant || ''));

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
      json(res, 200, {
        success: true,
        dryRun: true,
        receivedKeys: Object.keys(payload),
        parsed: { merchant, amount, txAmount, account, card, currency, date, time: bodyTime, note },
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

    const isTaxi = /uber|taxi|出租|打车|cars taxi/i.test(String(merchant || ''));
    const isCommuteRide = isTaxi && Number.isFinite(rideHour);
    const rideTitle = isCommuteRide ? (rideHour < 14 ? '打车上班' : '打车下班') : merchant;
    const baseNote = note || `自动记账${card ? ` · ${card}` : ''}`;
    const finalNote = isCommuteRide ? `${baseNote} [报销]` : baseNote;

    const [transaction] = await requestSupabase('transactions', {
      method: 'POST',
      body: JSON.stringify({
        dateLabel,
        iconBg: 'bg-black',
        iconType: 'apple',
        title: rideTitle,
        subtitle: targetAccount.name,
        tag: isCommuteRide ? '交通' : '其他',
        tagType: isCommuteRide ? 'transport' : 'shopping',
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
