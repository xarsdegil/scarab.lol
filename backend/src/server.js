import cors from 'cors'
import express from 'express'

const app = express()
const PORT = Number(process.env.PORT) || 4000
const BASE_URL = 'https://poe.ninja/poe1/api/economy/exchange/current/overview'
const IMAGE_HOST = 'https://web.poecdn.com/'

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN?.split(',').map((value) => value.trim()) || '*',
}))

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/scarabs', async (req, res) => {
  const league = typeof req.query.league === 'string' ? req.query.league : 'Keepers'
  const type = typeof req.query.type === 'string' ? req.query.type : 'Scarab'

  const params = new URLSearchParams({ league, type })
  console.log(`[proxy] request -> league=${league}, type=${type}`)

  try {
    const poeResponse = await fetch(`${BASE_URL}?${params.toString()}`)

    if (!poeResponse.ok) {
      return res.status(poeResponse.status).json({
        message: 'Upstream request failed',
        status: poeResponse.status,
      })
    }

    const payload = await poeResponse.json()
    const normalizedLines = normalizeExchangePayload(payload)
    console.log(`[proxy] upstream -> status=${poeResponse.status}, normalizedLines=${normalizedLines.length}`)
    res.set('Cache-Control', 'public, max-age=60')
    return res.json({ lines: normalizedLines })
  } catch (error) {
    console.error('Failed to reach poe.ninja', error)
    return res.status(502).json({ message: 'Failed to reach poe.ninja API' })
  }
})

function normalizeExchangePayload(payload) {
  const lines = Array.isArray(payload?.lines) ? payload.lines : []
  const items = Array.isArray(payload?.items) ? payload.items : []
  const itemMap = new Map(items.map((item) => [item.id, item]))
  const chaosToDivineRate = typeof payload?.core?.rates?.divine === 'number' ? Number(payload.core.rates.divine) : null

  return lines
    .map((line) => {
      if (typeof line?.primaryValue !== 'number') {
        return null
      }

      const meta = itemMap.get(line.id)
      const chaosValue = line.primaryValue
      const sparklineData = Array.isArray(line.sparkline?.data)
        ? line.sparkline.data.filter((value) => typeof value === 'number')
        : []

      return {
        id: line.id,
        currencyTypeName: meta?.name ?? line.id,
        chaosValue,
        divineValue: chaosToDivineRate ? chaosValue * chaosToDivineRate : 0,
        tradeVolume: typeof line.volumePrimaryValue === 'number' ? line.volumePrimaryValue : 0,
        icon: resolveIcon(meta?.image),
        sparkline: {
          totalChange: typeof line.sparkline?.totalChange === 'number' ? line.sparkline.totalChange : 0,
          data: sparklineData,
        },
        detailsId: meta?.detailsId ?? line.id,
      }
    })
    .filter((line) => line !== null)
}

function resolveIcon(imagePath) {
  if (typeof imagePath !== 'string' || imagePath.length === 0) {
    return null
  }

  try {
    const url = new URL(imagePath, IMAGE_HOST)
    return url.toString()
  } catch (error) {
    console.warn('Failed to resolve icon url', imagePath, error)
    return null
  }
}

app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`)
})
