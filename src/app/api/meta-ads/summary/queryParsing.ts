import { isBrandId, type BrandId } from '@/config/brands'
import { getAdAccountIds, BRAND_MARKET_AD_ACCOUNTS } from '@/config/adAccounts'
import { isValidMarket } from '@/lib/markets'
import {
  CRITERIA_QUERY_KEYS,
  defaultCriteriaForPreset,
  type TopCriteria,
} from '@/lib/meta/aggregate'

export function parseBrandId(value: string | null): BrandId | null {
  if (!value || !isBrandId(value)) {
    return null
  }
  return value
}

export function resolveTargetAccounts(
  brandId: BrandId,
  marketRaw: string | null,
  accountRaw: string | null,
): readonly string[] {
  if (accountRaw) {
    return [accountRaw]
  }
  if (marketRaw && isValidMarket(marketRaw)) {
    return getAdAccountIds(brandId, marketRaw)
  }
  return Object.values(BRAND_MARKET_AD_ACCOUNTS[brandId] ?? {})
    .flat()
    .filter((id): id is string => Boolean(id))
}

export function parseCriteriaFromQuery(
  params: URLSearchParams,
  preset: string,
): TopCriteria {
  const defaults = defaultCriteriaForPreset(preset)
  return {
    minSpend: numericParam(params, CRITERIA_QUERY_KEYS.minSpend, defaults.minSpend),
    topMinRoas: numericParam(params, CRITERIA_QUERY_KEYS.topMinRoas, defaults.topMinRoas),
    underMaxRoas: numericParam(params, CRITERIA_QUERY_KEYS.underMaxRoas, defaults.underMaxRoas),
  }
}

function numericParam(params: URLSearchParams, key: string, fallback: number): number {
  const raw = params.get(key)
  if (!raw) {
    return fallback
  }
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}
