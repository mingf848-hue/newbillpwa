import type { Connect } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const exchangeRateMiddleware: Connect.NextHandleFunction = async (req, res, next) => {
  if (!(req as { url?: string }).url?.startsWith('/api/exchange-rates')) {
    next()
    return
  }

  try {
    const fetchFn = (globalThis as unknown as { fetch: (input: string) => Promise<any> }).fetch
    const response = await fetchFn('https://api.coingecko.com/api/v3/simple/price?ids=tether,bitcoin,ethereum&vs_currencies=cny,aed')
    if (!response.ok) {
      res.statusCode = response.status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: `CoinGecko request failed: ${response.status}` }))
      return
    }

    const data = await response.json() as {
      bitcoin?: { cny?: number }
      ethereum?: { cny?: number }
      tether?: { aed?: number; cny?: number }
    }

    const tetherCny = data.tether?.cny ?? 0
    const tetherAed = data.tether?.aed ?? 0
    const rates = {
      CNY: 1,
      USDT: tetherCny,
      AED: tetherCny && tetherAed ? tetherCny / tetherAed : 0,
      BTC: data.bitcoin?.cny ?? 0,
      ETH: data.ethereum?.cny ?? 0,
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(rates))
  } catch (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }))
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-exchange-rates-api',
      configureServer(server) {
        server.middlewares.use(exchangeRateMiddleware)
      },
      configurePreviewServer(server) {
        server.middlewares.use(exchangeRateMiddleware)
      },
    },
  ],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
})
