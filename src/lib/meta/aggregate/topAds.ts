import type { TopCriteria } from './criteria'

export interface AdLeaderboardEntry {
  readonly adId: string
  readonly name: string
  readonly creativeType: 'image' | 'video' | 'unknown'
  readonly thumbnailUrl: string | null
  readonly accountId: string
  readonly spendEur: number
  readonly revenueEur: number
  readonly roas: number
  readonly status: string
}

const DEFAULT_LIMIT = 5

export function pickTopAds(
  ads: readonly AdLeaderboardEntry[],
  criteria: TopCriteria,
  limit: number = DEFAULT_LIMIT,
): readonly AdLeaderboardEntry[] {
  return ads
    .filter((a) => a.spendEur >= criteria.minSpend && a.roas >= criteria.topMinRoas)
    .sort((a, b) => b.roas - a.roas)
    .slice(0, limit)
}

export function pickTopByType(
  ads: readonly AdLeaderboardEntry[],
  type: 'image' | 'video',
  criteria: TopCriteria,
  limit: number = DEFAULT_LIMIT,
): readonly AdLeaderboardEntry[] {
  return pickTopAds(ads.filter((a) => a.creativeType === type), criteria, limit)
}

export function pickUnderperformers(
  ads: readonly AdLeaderboardEntry[],
  criteria: TopCriteria,
  limit: number = DEFAULT_LIMIT,
): readonly AdLeaderboardEntry[] {
  return ads
    .filter((a) => a.spendEur >= criteria.minSpend && a.roas <= criteria.underMaxRoas)
    .sort((a, b) => a.roas - b.roas)
    .slice(0, limit)
}
