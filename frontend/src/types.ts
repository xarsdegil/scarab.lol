export interface ScarabSparkline {
  totalChange: number
  data: number[]
}

export interface ScarabLine {
  id: string
  currencyTypeName: string
  chaosValue: number
  divineValue: number
  tradeVolume: number
  sparkline: ScarabSparkline
  detailsId: string
  icon?: string | null
}

export interface ScarabOverviewResponse {
  lines: ScarabLine[]
}
