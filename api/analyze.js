import { requestSupabase, parseAmount, formatAmount, formatTransactionDate, matchAccountByHint } from './_supabase.js';

const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const cleanJson = (text) => String(text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
const normalizeCategory = (value, isIncome = false) => {
  const source = String(value || '').trim();
  if (!source) return isIncome ? '工资' : '其他';
  if (/food|meal|餐|外卖/i.test(source)) return '餐饮';
  if (/transport|taxi|metro|地铁|公交|交通/i.test(source)) return '交通';
  if (/shop|shopping|购物|超市|商店/i.test(source)) return '购物';
  if (/fun|game|娱乐|电影/i.test(source)) return '娱乐';
  if (/rent|home|住房|房租/i.test(source)) return '住房';
  if (/medical|health|医院|医疗/i.test(source)) return '医疗';
  if (/education|study|学习|教育/i.test(source)) return '教育';
  if (/invest|理财|收益|利息/i.test(source)) return '理财';
  if (/salary|工资/i.test(source)) return '工资';
  if (/bonus|奖金/i.test(source)) return '奖金';
  if (/part[- ]?time|兼职/i.test(source)) return '兼职';
  if (/transfer|转账|划转/i.test(source)) return '转账';
  return source;
};
const TAG_TYPE_MAP = { '餐饮': 'shopping', '交通': 'transport', '购物': 'shopping', '娱乐': 'shopping', '住房': 'shopping', '医疗': 'shopping', '教育': 'shopping', '理财': 'investment', '工资': 'investment', '奖金': 'investment', '兼职': 'investment', '其他': 'shopping', '转账': 'transfer' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const { imageBase64, model, autoBook = true, transactionTime, manualPlatform } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    const useModel = model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!apiKey) {
      json(res, 500, { error: 'Missing GEMINI_API_KEY' });
      return;
    }
    if (!imageBase64) {
      json(res, 400, { error: 'Missing imageBase64' });
      return;
    }

    const prompt = `
你是一个严谨的记账助理。请分析付款截图、账单截图或转账截图，只返回 JSON，不要输出 Markdown。

识别规则：
1. 尽量识别真实金额、商户名、币种、时间、支付平台或账户线索。
2. category 只能从这些中文分类中选一个：餐饮、交通、购物、娱乐、住房、医疗、教育、理财、工资、奖金、兼职、其他、转账。
3. type 只能是 "expense" 或 "income"。
4. accountHint 尽量填写：支付宝、微信、Apple Pay、银行卡、现金、OKX、Bitget、火币、HTX、币安、Bybit、Gate.io、KuCoin、MEXC；不确定就留空。
5. 如果截图里有多笔交易，返回数组；如果只有一笔，也返回长度为 1 的数组。
6. note 保持简短，不要编造；merchant 优先使用截图里真实可见的商户或对象名。

返回格式：
[
  {
    "amount": 20,
    "type": "expense",
    "category": "餐饮",
    "merchant": "美团外卖",
    "note": "午餐",
    "currency": "CNY",
    "accountHint": "支付宝"
  }
]
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: String(imageBase64).replace(/^data:image\/\w+;base64,/, ''),
              },
            },
          ],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini analyze failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    const parsed = JSON.parse(cleanJson(text));
    const items = Array.isArray(parsed) ? parsed : [parsed];

    if (autoBook === false) {
      json(res, 200, { success: true, items, rawText: text, autoBooked: false });
      return;
    }

    const accounts = await requestSupabase('accounts?select=*');
    const created = [];

    for (const [index, item] of items.entries()) {
      const isIncome = String(item?.type || '').toLowerCase() === 'income';
      const amount = Math.abs(parseAmount(item?.amount));
      if (!amount) continue;

      const account = matchAccountByHint(accounts, manualPlatform || item?.accountHint || item?.account || item?.paymentMethod || '');
      if (!account) continue;

      const txDate = transactionTime ? new Date(transactionTime) : new Date();
      txDate.setSeconds(txDate.getSeconds() + index);
      const { dateLabel, fullDate, time } = formatTransactionDate(txDate);
      const category = normalizeCategory(item?.category, isIncome);
      const merchant = String(item?.merchant || item?.title || category || 'AI 识别记账').trim();
      const note = String(item?.note || item?.product_name || merchant).trim();
      const nextBalance = parseAmount(account.balance) + (isIncome ? amount : -amount);

      await requestSupabase(`accounts?id=eq.${encodeURIComponent(account.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ balance: formatAmount(nextBalance) }),
      });
      account.balance = formatAmount(nextBalance);

      const [transaction] = await requestSupabase('transactions', {
        method: 'POST',
        body: JSON.stringify({
          dateLabel,
          iconBg: 'bg-[#1677ff]',
          iconType: account.icon || 'landmark',
          title: merchant,
          subtitle: account.name,
          tag: category,
          tagType: TAG_TYPE_MAP[category] || (isIncome ? 'investment' : 'shopping'),
          amount: `${isIncome ? '+' : '-'}${formatAmount(amount)}`,
          isIncome,
          time,
          fullDate,
          currency: String(item?.currency || account.currency || 'CNY').toUpperCase(),
          paymentMethod: account.name,
          note,
        }),
      });
      created.push(transaction);
    }

    json(res, 200, {
      success: true,
      items,
      rawText: text,
      autoBooked: true,
      createdCount: created.length,
      created,
    });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
