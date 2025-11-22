import envExampleRaw from '../.env.example?raw'

type KnownEnvKey = 'VITE_API_URL' | 'VITE_CONTACT_EMAIL' | 'VITE_CONTACT_SOCIAL_LABEL' | 'VITE_CONTACT_SOCIAL_URL'
type EnvSnapshot = Record<string, string>

const FALLBACK_ENV: EnvSnapshot = envExampleRaw.split(/\r?\n/).reduce<EnvSnapshot>((acc, line) => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) {
    return acc
  }

  const equalsIndex = trimmed.indexOf('=')
  if (equalsIndex === -1) {
    return acc
  }

  const key = trimmed.slice(0, equalsIndex).trim()
  const value = trimmed.slice(equalsIndex + 1).trim()
  if (key) {
    acc[key] = value
  }

  return acc
}, {})

export function getEnvValue(key: KnownEnvKey): string | undefined {
  const raw = (import.meta.env as Record<string, unknown>)[key]
  if (typeof raw === 'string' && raw.length > 0) {
    return raw
  }

  return FALLBACK_ENV[key]
}
