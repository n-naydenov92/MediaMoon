export interface SharePair {
  readonly campaignsPct: number
  readonly flowsPct: number
}

export function shareOfTotal(
  campaigns: number | null,
  flows: number | null,
): SharePair {
  const c = campaigns ?? 0
  const f = flows ?? 0
  const sum = c + f
  if (sum <= 0) {
    return { campaignsPct: 0, flowsPct: 0 }
  }
  return { campaignsPct: (c / sum) * 100, flowsPct: (f / sum) * 100 }
}

export function absolutePercent(rate: number | null): number {
  return (rate ?? 0) * 100
}
