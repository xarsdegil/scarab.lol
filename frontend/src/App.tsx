import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { useScarabPrices } from './hooks/useScarabPrices'
import type { ScarabLine } from './types'
import { getRegexFor } from './regexMap'
import { getEnvValue } from './envFallback'

const DEFAULT_MIN_PRICE = 0
const DEFAULT_MAX_PRICE = 0.7
const PRICE_STEP = 0.01
const MAX_REGEX_LENGTH = 300
const TAB_TITLE = 'gl for your gamba exile'
const CONTACT_EMAIL = getEnvValue('VITE_CONTACT_EMAIL') ?? 'you@example.com'
const CONTACT_SOCIAL_LABEL = getEnvValue('VITE_CONTACT_SOCIAL_LABEL') ?? '@yourhandle'
const CONTACT_SOCIAL_URL = getEnvValue('VITE_CONTACT_SOCIAL_URL') ?? 'https://x.com/yourhandle'

function formatChaos(value: number) {
  return `${value.toFixed(2)}c`
}

function App() {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = TAB_TITLE
    }
  }, [])

  const [priceRange, setPriceRange] = useState({ min: DEFAULT_MIN_PRICE, max: DEFAULT_MAX_PRICE })
  const [selection, setSelection] = useState<Record<string, boolean>>({})
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const copyTimeoutRef = useRef<number | null>(null)
  const { sortedData, isLoading, isError, error, refetch, isFetching } = useScarabPrices()

  const sliderMax = useMemo(() => {
    if (!sortedData.length) return DEFAULT_MAX_PRICE
    const highest = sortedData[sortedData.length - 1].chaosValue
    return Math.max(DEFAULT_MAX_PRICE, Math.ceil(highest * 100) / 100)
  }, [sortedData])

  const filtered = useMemo(() => {
    return sortedData.filter((line) => line.chaosValue >= priceRange.min && line.chaosValue <= priceRange.max)
  }, [sortedData, priceRange])

  const selectedScarabs = useMemo(() => {
    return filtered.filter((line) => selection[line.detailsId] !== false)
  }, [filtered, selection])

  const regexParts = useMemo(() => {
    return selectedScarabs
      .map((line) => getRegexFor(line.detailsId) ?? line.detailsId)
      .filter((value): value is string => Boolean(value))
  }, [selectedScarabs])

  const combinedRegex = regexParts.length ? `"${regexParts.join('|')}"` : '""'
  const regexLength = combinedRegex.length
  const regexTooLong = regexLength > MAX_REGEX_LENGTH

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    const iconCandidates = sortedData
      .map((line) => line.icon)
      .filter((icon): icon is string => Boolean(icon))
    if (!iconCandidates.length) {
      return
    }

    const randomIcon = iconCandidates[Math.floor(Math.random() * iconCandidates.length)]
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = randomIcon
  }, [sortedData])

  useEffect(() => {
    setSelection((prev) => {
      const next: Record<string, boolean> = {}
      let changed = false

      sortedData.forEach((line) => {
        if (Object.prototype.hasOwnProperty.call(prev, line.detailsId)) {
          next[line.detailsId] = prev[line.detailsId]
        } else {
          next[line.detailsId] = true
          changed = true
        }
      })

      if (Object.keys(prev).length !== Object.keys(next).length) {
        changed = true
      }

      return changed ? next : prev
    })
  }, [sortedData])

  useEffect(() => {
    setPriceRange((prev) => {
      const nextMax = Math.min(prev.max, sliderMax)
      const nextMin = Math.min(prev.min, nextMax)
      if (nextMax === prev.max && nextMin === prev.min) {
        return prev
      }
      return { min: nextMin, max: nextMax }
    })
  }, [sliderMax])

  useEffect(() => {
    console.log('[ui] scarab query status', {
      isLoading,
      isFetching,
      isError,
      rawCount: sortedData.length,
      filteredCount: filtered.length,
      selectedCount: selectedScarabs.length,
    })
  }, [isLoading, isFetching, isError, sortedData, filtered, selectedScarabs])

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current)
        copyTimeoutRef.current = null
      }
    }
  }, [])

  const scheduleCopyReset = () => {
    if (copyTimeoutRef.current !== null) {
      window.clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = null
    }
    copyTimeoutRef.current = window.setTimeout(() => setCopyStatus('idle'), 2000)
  }

  const handleCopy = async () => {
    if (!regexParts.length) return
    try {
      await navigator.clipboard.writeText(combinedRegex)
      setCopyStatus('copied')
    } catch (copyError) {
      console.error('Failed to copy regex to clipboard', copyError)
      setCopyStatus('error')
    } finally {
      scheduleCopyReset()
    }
  }

  const handleMinChange = (value: number) => {
    setPriceRange((prev) => {
      const clamped = Math.max(DEFAULT_MIN_PRICE, Math.min(value, sliderMax))
      const nextMin = Math.min(clamped, prev.max)
      if (nextMin === prev.min) return prev
      return { ...prev, min: nextMin }
    })
  }

  const handleMaxChange = (value: number) => {
    setPriceRange((prev) => {
      const clamped = Math.min(Math.max(value, prev.min), sliderMax)
      if (clamped === prev.max) return prev
      return { ...prev, max: clamped }
    })
  }

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setSelection((prev) => ({ ...prev, [id]: checked }))
  }

  const renderGrid = (rows: ScarabLine[]) => {
    if (!rows.length) {
      return <p className="empty-message">No scarabs match this price range.</p>
    }

    return (
      <div className="scarab-grid">
        {rows.map((line) => {
          const isChecked = selection[line.detailsId] !== false
          return (
            <article key={line.detailsId} className={`scarab-card ${isChecked ? '' : 'scarab-card--muted'}`}>
              <div className="scarab-card-header">
                <label className="scarab-checkbox">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(event) => handleCheckboxChange(line.detailsId, event.target.checked)}
                  />
                  <span>Select</span>
                </label>
                <span className="scarab-price">{formatChaos(line.chaosValue)}</span>
              </div>
              <div className="scarab-card-body">
                {line.icon ? <img src={line.icon} alt={line.currencyTypeName} className="scarab-icon" loading="lazy" /> : null}
                <div>
                  <span className="scarab-name">{line.currencyTypeName}</span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  const copyButtonLabel = copyStatus === 'copied' ? 'Copied!' : copyStatus === 'error' ? 'Copy Failed' : 'Copy Regex'

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">PoE Scarab Dashboard</p>
          <h1>Keepers League Prices</h1>
          <p className="subtitle">Data refreshes from the Poe.ninja API every 5 minutes.</p>
        </div>
        <button className="refresh" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </header>

      {isError && (
        <div className="error-banner">
          <span>Failed to load scarab prices: {error instanceof Error ? error.message : 'Unknown error'}</span>
          <button onClick={() => refetch()}>Try again</button>
        </div>
      )}

      <section className="layout">
        <section className="panel full">
          <h2>Regex Output</h2>
          <p className="hint">Pattern generated for {selectedScarabs.length} selected scarabs:</p>
          <div className="regex-toolbar">
            <div className="regex-output">{combinedRegex}</div>
            <button className="copy-button" onClick={handleCopy} disabled={!regexParts.length}>
              {copyButtonLabel}
            </button>
          </div>
          {regexTooLong ? (
            <p className="warning">Regex length is {regexLength}/{MAX_REGEX_LENGTH} characters. Please shorten the pattern.</p>
          ) : (
            <p className="hint">Patterns merge automatically as "regex1|regex2" ({regexLength}/{MAX_REGEX_LENGTH}).</p>
          )}
          <div className="price-inputs grouped">
            <label>
              Min Chaos
              <input
                className="number-input"
                type="number"
                min={DEFAULT_MIN_PRICE}
                max={priceRange.max}
                step={PRICE_STEP}
                value={priceRange.min}
                onChange={(event) => handleMinChange(Number(event.target.value))}
              />
            </label>
            <label>
              Max Chaos
              <input
                className="number-input"
                type="number"
                min={priceRange.min}
                max={sliderMax}
                step={PRICE_STEP}
                value={priceRange.max}
                onChange={(event) => handleMaxChange(Number(event.target.value))}
              />
            </label>
          </div>
          <p className="hint">Use these inputs to adjust the min and max chaos range.</p>
        </section>

        <section className="panel wide">
          <div className="panel-header">
            <h2>Scarab List</h2>
            <span className="pill">
              {selectedScarabs.length}/{filtered.length} selected
            </span>
          </div>
          {isLoading ? (
            <p>Loading scarab data...</p>
          ) : (
            renderGrid(filtered)
          )}
        </section>
      </section>
      <footer className="app-footer">
        <p className="footer-callout">Notice anything off on the site? Reach out and I'll take a look.</p>
        <div className="footer-links">
          <a href={`mailto:${CONTACT_EMAIL}`} className="footer-link">
            {CONTACT_EMAIL}
          </a>
          <a href={CONTACT_SOCIAL_URL} className="footer-link" target="_blank" rel="noreferrer">
            {CONTACT_SOCIAL_LABEL}
          </a>
        </div>
      </footer>
    </main>
  )
}

export default App


