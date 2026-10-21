import type { GraphUsage, ThrottleInfo, ThrottleScope } from './rateLimit'

const APP_THROTTLE_CODE = 4
const AD_ACCOUNT_THROTTLE_CODES: ReadonlySet<number> = new Set([17, 32, 613])
const BUSINESS_USE_CASE_THROTTLE_CODE_MIN = 80000
const BUSINESS_USE_CASE_THROTTLE_CODE_MAX = 80014
const TRANSIENT_CODES: ReadonlySet<number> = new Set([1, 2])
const HTTP_SERVER_ERROR_MIN = 500
// Meta's documented block once the short-term score is exhausted: 300 s on Limited
// (development) access, 60 s on Full access.
const LIMITED_ACCESS_BLOCK_MS = 300_000
const FULL_ACCESS_BLOCK_MS = 60_000
const FULL_ACCESS_TIER = 'standard_access'
const MS_PER_MINUTE = 60_000
const UNREADABLE_RESPONSE_MESSAGE = 'Meta returned an unreadable response.'

export type MetaFailureReason = 'throttled' | 'transient' | 'unreachable' | 'rejected'

interface MetaApiErrorInit {
  readonly message: string
  readonly reason: MetaFailureReason
  readonly code?: number | null
  readonly subcode?: number | null
  readonly fbtraceId?: string | null
  readonly throttle?: ThrottleInfo | null
}

export class MetaApiError extends Error {
  readonly reason: MetaFailureReason

  readonly code: number | null

  readonly subcode: number | null

  readonly fbtraceId: string | null

  readonly throttle: ThrottleInfo | null

  constructor(init: MetaApiErrorInit) {
    super(init.message)
    this.name = 'MetaApiError'
    this.reason = init.reason
    this.code = init.code ?? null
    this.subcode = init.subcode ?? null
    this.fbtraceId = init.fbtraceId ?? null
    this.throttle = init.throttle ?? null
  }
}

interface GraphErrorRaw {
  readonly message?: string
  readonly code?: number
  readonly error_subcode?: number
  readonly is_transient?: boolean
  readonly error_user_title?: string
  readonly error_user_msg?: string
  readonly fbtrace_id?: string
}

// Graph also reports some failures with a 2xx status and an `error` body, so the body
// decides, not only the status.
export function toMetaApiError(response: Response, body: unknown, usage: GraphUsage): MetaApiError | null {
  const raw = readGraphError(body)
  if (!raw && response.ok && body !== null) {
    return null
  }
  const code = raw?.code ?? null
  const throttle = code === null ? null : classifyThrottle(code, usage)
  return new MetaApiError({
    message: throttle ? throttleMessage(throttle) : describeFailure(raw, response),
    reason: failureReason(raw, response, throttle),
    code,
    subcode: raw?.error_subcode,
    fbtraceId: raw?.fbtrace_id,
    throttle,
  })
}

export function throttledError(throttle: ThrottleInfo): MetaApiError {
  return new MetaApiError({ message: throttleMessage(throttle), reason: 'throttled', throttle })
}

export function unreachableError(timedOut: boolean): MetaApiError {
  return new MetaApiError({
    message: timedOut ? 'Meta did not respond in time.' : 'Could not reach Meta.',
    reason: 'unreachable',
  })
}

function readGraphError(body: unknown): GraphErrorRaw | null {
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return null
  }
  const { error } = body
  return typeof error === 'object' && error !== null ? error : null
}

function classifyThrottle(code: number, usage: GraphUsage): ThrottleInfo | null {
  const scope = throttleScope(code)
  if (!scope) {
    return null
  }
  const retryAfterMs = usage.regainMs > 0 ? usage.regainMs : defaultBlockMs(usage.tier)
  return { scope, retryAfterMs }
}

function throttleScope(code: number): ThrottleScope | null {
  if (code === APP_THROTTLE_CODE) {
    return 'app'
  }
  const isBusinessUseCaseCode = code >= BUSINESS_USE_CASE_THROTTLE_CODE_MIN
    && code <= BUSINESS_USE_CASE_THROTTLE_CODE_MAX
  return AD_ACCOUNT_THROTTLE_CODES.has(code) || isBusinessUseCaseCode ? 'adAccount' : null
}

function defaultBlockMs(tier: string | null): number {
  return tier === FULL_ACCESS_TIER ? FULL_ACCESS_BLOCK_MS : LIMITED_ACCESS_BLOCK_MS
}

function failureReason(
  raw: GraphErrorRaw | null,
  response: Response,
  throttle: ThrottleInfo | null,
): MetaFailureReason {
  if (throttle) {
    return 'throttled'
  }
  const hasTransientCode = raw?.code !== undefined && TRANSIENT_CODES.has(raw.code)
  const isBodilessServerError = !raw && response.status >= HTTP_SERVER_ERROR_MIN
  if (raw?.is_transient === true || hasTransientCode || isBodilessServerError) {
    return 'transient'
  }
  return 'rejected'
}

function describeFailure(raw: GraphErrorRaw | null, response: Response): string {
  // error_user_msg is Meta's human-readable explanation (error_user_title its short
  // heading) — far clearer than the generic "Invalid parameter" message.
  if (raw?.error_user_msg) {
    return raw.error_user_title ? `${raw.error_user_title}: ${raw.error_user_msg}` : raw.error_user_msg
  }
  if (raw?.message) {
    return raw.message
  }
  return response.ok ? UNREADABLE_RESPONSE_MESSAGE : `Graph API HTTP ${response.status}: ${response.statusText}`
}

function throttleMessage({ scope, retryAfterMs }: ThrottleInfo): string {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / MS_PER_MINUTE))
  const target = scope === 'app' ? ' for the whole app (all brands)' : ''
  return `Meta temporarily limited requests${target}. Try again in about ${minutes} min.`
}
