// Monetary fields (`spend`, `revenue`) are in the account's own currency —
// callers convert to EUR via `convertToEur` using `currencyCode`.
export interface GoogleAdsTotals {
  readonly spend: number
  readonly revenue: number
  readonly conversions: number
  readonly impressions: number
  readonly clicks: number
}

// One calendar day of metrics; monetary fields in the account's own currency.
export interface GoogleAdsDailyTotals extends GoogleAdsTotals {
  readonly date: string
}

export interface GoogleAdsAccountInsights {
  readonly customerId: string
  readonly currencyCode: string
  readonly totals: GoogleAdsTotals
  readonly byDay: readonly GoogleAdsDailyTotals[]
}
