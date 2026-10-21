import { NextResponse } from 'next/server'
import { MetaApiError, type MetaFailureReason } from '@/lib/gateways/MetaAdsGateway'

const MS_PER_SECOND = 1000
const THROTTLED_STATUS = 429
const RETRY_NOW_STATUS = 504
const UNKNOWN_FAILURE_STATUS = 500
// 503 is deliberately unused: across the app it means "Meta token not configured"
// (resolveBrandToken, and the clients that show a no-token state for it).
const STATUS_BY_REASON: Readonly<Record<MetaFailureReason, number>> = {
  throttled: THROTTLED_STATUS,
  transient: RETRY_NOW_STATUS,
  unreachable: RETRY_NOW_STATUS,
  rejected: 502,
}

export const META_THROTTLED_CODE = 'META_THROTTLED'

// One mapping for every Meta route, so clients can tell "wait" (429 + Retry-After)
// from "retry now" (504) from "fix the request" (502).
export function metaErrorResponse(
  err: unknown,
  extra: Readonly<Record<string, string>> = {},
): NextResponse {
  if (!(err instanceof MetaApiError)) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message, ...extra }, { status: UNKNOWN_FAILURE_STATUS })
  }
  if (err.throttle) {
    const retryAfterSeconds = Math.ceil(err.throttle.retryAfterMs / MS_PER_SECOND)
    return NextResponse.json(
      { error: err.message, code: META_THROTTLED_CODE, retryAfterSeconds, scope: err.throttle.scope, ...extra },
      { status: THROTTLED_STATUS, headers: { 'Retry-After': String(retryAfterSeconds) } },
    )
  }
  return NextResponse.json(
    { error: err.message, metaCode: err.code, metaSubcode: err.subcode, ...extra },
    { status: STATUS_BY_REASON[err.reason] },
  )
}
