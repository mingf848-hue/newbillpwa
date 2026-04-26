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
    const { prompt, imageBase64, model } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    const useModel = model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!apiKey) {
      json(res, 500, { error: 'Missing GEMINI_API_KEY' });
      return;
    }
    if (!prompt) {
      json(res, 400, { error: 'Missing prompt' });
      return;
    }

    const parts = [{ text: prompt }];
    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: String(imageBase64).replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed (${response.status}): ${await response.text()}`);
    }

    json(res, 200, await response.json());
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
