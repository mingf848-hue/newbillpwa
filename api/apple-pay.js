import { requestSupabase, parseAmount, formatAmount, formatTransactionDate, matchAccountByHint } from './_supabase.js';

const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const secret = process.env.APPLE_PAY_WEBHOOK_KEY;
    const incomingKey = req.query?.key || req.headers?.['x-webhook-key'];
    if (secret && incomingKey !== secret) {
      json(res, 401, { error: 'Unauthorized' });
      return;
    }

    const { amount, merchant, account, card, currency, date, note } = req.body || {};
    const txAmount = Math.abs(parseAmount(amount));
    if (!merchant || !txAmount) {
      json(res, 400, { error: 'Missing merchant or amount' });
      return;
    }

    const accounts = await requestSupabase('accounts?select=*');
    const targetAccount = matchAccountByHint(accounts, account || card || 'Apple Pay');
    if (!targetAccount) {
      json(res, 400, { error: 'No available account found' });
      return;
    }

    const { dateLabel, fullDate, time } = formatTransactionDate(date);
    const [transaction] = await requestSupabase('transactions', {
      method: 'POST',
      body: JSON.stringify({
        dateLabel,
        iconBg: 'bg-black',
        iconType: 'apple',
        title: merchant,
        subtitle: targetAccount.name,
        tag: '其他',
        tagType: 'shopping',
        amount: `-${formatAmount(txAmount)}`,
        isIncome: false,
        time,
        fullDate,
        currency: currency || targetAccount.currency || 'CNY',
        paymentMethod: 'Apple Pay',
        note: note || `Apple Pay 自动记账${card ? ` · ${card}` : ''}`,
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
