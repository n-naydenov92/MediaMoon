import { ALL_MARKETS } from '@/lib/markets'
import { normalizeAccountId } from '@/lib/meta/accountId'

// Meta ids are digits; the length cap only keeps absurd input out.
const GRAPH_ID = /^\d{1,32}$/
const ACCOUNT_PREFIX = 'act_'

export type ParamResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly status: 400 | 403 }

const BAD_REQUEST = { ok: false, status: 400 } as const
const FORBIDDEN = { ok: false, status: 403 } as const

export interface MarketChoice {
  /** Every market code the brand has. */
  readonly brandMarkets: readonly string[]
  /** The brand's market codes this person may use for the permission at hand. */
  readonly allowedMarkets: readonly string[]
}

/**
 * The markets a request covers. No market or "ALL" means every market the person may
 * use, never the brand's full list. A market the brand doesn't have is a bad request;
 * one it has but the person may not use is forbidden.
 */
export function resolveMarketParam(raw: string | null, markets: MarketChoice): ParamResult<readonly string[]> {
  if (!raw || raw === ALL_MARKETS) {
    return { ok: true, value: markets.allowedMarkets }
  }
  if (!markets.brandMarkets.includes(raw)) {
    return BAD_REQUEST
  }
  return markets.allowedMarkets.includes(raw) ? { ok: true, value: [raw] } : FORBIDDEN
}

/**
 * The ad account a request names, in Meta's `act_<digits>` form, or null when it names
 * none. A named account must be one the person may use.
 */
export function resolveAccountParam(
  raw: string | null,
  allowedAccountIds: readonly string[],
): ParamResult<string | null> {
  if (!raw) {
    return { ok: true, value: null }
  }
  const accountId = normalizeAccountId(raw)
  if (!isGraphId(accountId.slice(ACCOUNT_PREFIX.length))) {
    return BAD_REQUEST
  }
  return allowedAccountIds.includes(accountId) ? { ok: true, value: accountId } : FORBIDDEN
}

/** Whether a value can be a Meta object id: campaigns, ad sets, ads, and accounts without `act_`. */
export function isGraphId(value: string): boolean {
  return GRAPH_ID.test(value)
}
