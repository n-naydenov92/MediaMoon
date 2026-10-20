const APP_USAGE_HEADER = 'x-app-usage'
const BUSINESS_USE_CASE_USAGE_HEADER = 'x-business-use-case-usage'
const AD_ACCOUNT_USAGE_HEADER = 'x-ad-account-usage'
const MS_PER_SECOND = 1000
const MS_PER_MINUTE = 60_000
const USAGE_WARNING_PCT = 80
const APP_SCOPE_KEY = 'app'
const AD_ACCOUNT_IN_PATH = /\/(act_\d+)(?:\/|$)/

export type ThrottleScope = 'app' | 'adAccount'

export interface ThrottleInfo {
  readonly scope: ThrottleScope
  readonly retryAfterMs: number
}

export interface GraphUsage {
  readonly peakPct: number
  readonly regainMs: number
  readonly tier: string | null
}

interface GraphCallLog {
  readonly method: string
  readonly path: string
  readonly status: number
  readonly usage: GraphUsage
  readonly throttle: ThrottleInfo | null
}

interface BlockedCallLog {
  readonly method: string
  readonly path: string
  readonly throttle: ThrottleInfo
}

const EMPTY_USAGE: GraphUsage = { peakPct: 0, regainMs: 0, tier: null }

// Per server instance: once Meta throttles a scope, further calls for it are refused
// locally until the block expires — calling Meta while blocked only extends the block
// and counts toward the error rate that gates the Full Access tier.
const blockedUntilByScope = new Map<string, number>()

export function parseGraphUsage(headers: Headers): GraphUsage {
  return [
    readAppUsage(headers.get(APP_USAGE_HEADER)),
    ...readBusinessUseCaseUsage(headers.get(BUSINESS_USE_CASE_USAGE_HEADER)),
    readAdAccountUsage(headers.get(AD_ACCOUNT_USAGE_HEADER)),
  ].reduce(mergeUsage, EMPTY_USAGE)
}

export function activeThrottle(path: string): ThrottleInfo | null {
  const now = Date.now()
  const appBlockedUntil = blockedUntilByScope.get(APP_SCOPE_KEY) ?? 0
  if (appBlockedUntil > now) {
    return { scope: 'app', retryAfterMs: appBlockedUntil - now }
  }
  const accountKey = adAccountKey(path)
  const accountBlockedUntil = accountKey ? (blockedUntilByScope.get(accountKey) ?? 0) : 0
  if (accountBlockedUntil > now) {
    return { scope: 'adAccount', retryAfterMs: accountBlockedUntil - now }
  }
  return null
}

export function recordThrottle(path: string, throttle: ThrottleInfo): void {
  const key = throttle.scope === 'app' ? APP_SCOPE_KEY : adAccountKey(path)
  if (key) {
    blockedUntilByScope.set(key, Date.now() + throttle.retryAfterMs)
  }
}

export function logGraphCall(call: GraphCallLog): void {
  if (call.usage.peakPct < USAGE_WARNING_PCT && !call.throttle) {
    return
  }
  // eslint-disable-next-line no-console
  console.warn('[meta-usage]', JSON.stringify({
    method: call.method,
    path: call.path,
    status: call.status,
    peakPct: call.usage.peakPct,
    tier: call.usage.tier,
    throttledForMs: call.throttle?.retryAfterMs ?? 0,
  }))
}

export function logBlockedCall(call: BlockedCallLog): void {
  // eslint-disable-next-line no-console
  console.warn('[meta-usage]', JSON.stringify({
    method: call.method,
    path: call.path,
    blockedLocally: true,
    scope: call.throttle.scope,
    retryAfterMs: call.throttle.retryAfterMs,
  }))
}

function adAccountKey(path: string): string | null {
  return AD_ACCOUNT_IN_PATH.exec(path)?.[1] ?? null
}

function mergeUsage(a: GraphUsage, b: GraphUsage): GraphUsage {
  return {
    peakPct: Math.max(a.peakPct, b.peakPct),
    regainMs: Math.max(a.regainMs, b.regainMs),
    tier: a.tier ?? b.tier,
  }
}

function readAppUsage(raw: string | null): GraphUsage {
  const record = asRecord(parseJson(raw))
  return record ? { peakPct: peakPercent(record), regainMs: 0, tier: null } : EMPTY_USAGE
}

// Keyed by business object id (ad account / page), each holding one entry per use case.
function readBusinessUseCaseUsage(raw: string | null): readonly GraphUsage[] {
  const record = asRecord(parseJson(raw))
  if (!record) {
    return []
  }
  return Object.values(record)
    .flatMap((entries) => (Array.isArray(entries) ? entries : []))
    .map(asRecord)
    .filter((entry): entry is Record<string, unknown> => entry !== null)
    .map((entry) => ({
      peakPct: peakPercent(entry),
      regainMs: numberField(entry, 'estimated_time_to_regain_access') * MS_PER_MINUTE,
      tier: stringField(entry, 'ads_api_access_tier'),
    }))
}

function readAdAccountUsage(raw: string | null): GraphUsage {
  const record = asRecord(parseJson(raw))
  if (!record) {
    return EMPTY_USAGE
  }
  return {
    peakPct: numberField(record, 'acc_id_util_pct'),
    regainMs: numberField(record, 'reset_time_duration') * MS_PER_SECOND,
    tier: stringField(record, 'ads_api_access_tier'),
  }
}

function peakPercent(record: Record<string, unknown>): number {
  return Math.max(
    numberField(record, 'call_count'),
    numberField(record, 'total_cputime'),
    numberField(record, 'total_time'),
  )
}

function parseJson(raw: string | null): unknown {
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function numberField(record: Record<string, unknown>, key: string): number {
  const value = record[key]
  return typeof value === 'number' ? value : 0
}

function stringField(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  return typeof value === 'string' ? value : null
}
