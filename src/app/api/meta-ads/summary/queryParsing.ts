import { accountIdsForSelection, getBrandContext, type BrandContext } from '@/lib/tenancy'
import { ALL_MARKETS } from '@/lib/markets'
import {
  CRITERIA_QUERY_KEYS,
  defaultCriteriaForPreset,
  type TopCriteria,
} from '@/lib/meta/aggregate'

export async function findBrandFromQuery(value: string | null): Promise<BrandContext | null> {
  return value ? getBrandContext(value) : null
}

export function resolveTargetAccounts(
  ctx: BrandContext,
  marketRaw: string | null,
  accountRaw: string | null,
): readonly string[] {
  if (accountRaw) {
    return [accountRaw]
  }
  // A market the brand doesn't have matches no account, rather than widening to all.
  return accountIdsForSelection(ctx.metaAccounts, marketRaw || ALL_MARKETS)
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
