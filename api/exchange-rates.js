const FALLBACK_RATES = {
  CNY: 1,
  USDT: 7.25,
  AED: 1.97,
  BTC: 470000,
  ETH: 24000,
};

const sendJson = (res, statusCode, payload, source) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
  res.setHeader('X-Exchange-Rates-Source', source);
  res.end(JSON.stringify(payload));
};

export default async function handler(_req, res) {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,bitcoin,ethereum&vs_currencies=cny,aed', {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      sendJson(res, 200, FALLBACK_RATES, `fallback-${response.status}`);
      return;
    }

    const data = await response.json();
    const tetherCny = data?.tether?.cny ?? 0;
    const tetherAed = data?.tether?.aed ?? 0;
    const rates = {
      CNY: 1,
      USDT: tetherCny || FALLBACK_RATES.USDT,
      AED: tetherCny && tetherAed ? tetherCny / tetherAed : FALLBACK_RATES.AED,
      BTC: data?.bitcoin?.cny ?? FALLBACK_RATES.BTC,
      ETH: data?.ethereum?.cny ?? FALLBACK_RATES.ETH,
    };

    sendJson(res, 200, rates, 'coingecko');
  } catch (_error) {
    sendJson(res, 200, FALLBACK_RATES, 'fallback-error');
  }
}
