import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchScarabPrices } from '../api/poeNinja'
import type { ScarabLine } from '../types'

const FIVE_MINUTES = 5 * 60 * 1000

export function useScarabPrices() {
  const query = useQuery<ScarabLine[]>({
    queryKey: ['scarab-prices'],
    queryFn: ({ signal }) => fetchScarabPrices(signal),
    staleTime: FIVE_MINUTES,
    refetchInterval: FIVE_MINUTES,
  })

  const sortedData = useMemo(() => {
    if (!query.data) return []
    return [...query.data].sort((a, b) => a.chaosValue - b.chaosValue)
  }, [query.data])

  return {
    ...query,
    sortedData,
  }
}
