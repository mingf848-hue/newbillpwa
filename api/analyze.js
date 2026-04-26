const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const cleanJson = (text) => String(text || '').replace(/```json/gi, '').replace(/```/g, '').trim();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const { imageBase64, model } = req.body || {};
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
    json(res, 200, { success: true, items, rawText: text });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
