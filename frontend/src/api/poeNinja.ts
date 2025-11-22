import type { ScarabLine, ScarabOverviewResponse } from '../types'
import { getEnvValue } from '../envFallback'

const API_ROUTE = '/api/scarabs'
const DEFAULT_PARAMS = new URLSearchParams({
  league: 'Keepers',
  type: 'Scarab',
})

function resolveBackendBaseUrl() {
  const envBase = getEnvValue('VITE_API_URL')
  if (envBase && envBase.length > 0) {
    return envBase.endsWith('/') ? envBase.slice(0, -1) : envBase
  }

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000'
  }

  return ''
}

export async function fetchScarabPrices(signal?: AbortSignal): Promise<ScarabLine[]> {
  const backendBaseUrl = resolveBackendBaseUrl()
  const url = `${backendBaseUrl}${API_ROUTE}?${DEFAULT_PARAMS.toString()}`
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Scarab proxy istegi basarisiz oldu: ${response.status}`)
  }

  const payload = (await response.json()) as ScarabOverviewResponse

  if (!payload.lines) {
    throw new Error('Beklenmedik yanit: lines alani eksik')
  }

  return payload.lines.filter((line) => typeof line.chaosValue === 'number')
}

