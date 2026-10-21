import { useCallback, useEffect, useState } from 'react'
import type { MetaUsage, ThrottleScope } from '@/lib/gateways/MetaAdsGateway'

const THROTTLED_STATUS = 429

export type MetaUsageState =
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly usage: MetaUsage; readonly measuredAt: number }
  | { readonly status: 'throttled'; readonly scope: ThrottleScope; readonly retryAfterSeconds: number }
  | { readonly status: 'error'; readonly message: string }

export interface MetaUsageControls {
  readonly state: MetaUsageState
  readonly refresh: () => void
}

interface UsageResponse {
  readonly usage: MetaUsage
  readonly measuredAt: number
}

interface ErrorResponse {
  readonly error?: string
  readonly scope?: ThrottleScope
  readonly retryAfterSeconds?: number
}

// Asks Meta only while the dialog is open — once on open and on each Refresh, never on
// a timer — so watching the limits costs two reads per look.
export function useMetaUsage(accountId: string, open: boolean): MetaUsageControls {
  const [state, setState] = useState<MetaUsageState>({ status: 'loading' })
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    if (!open || !accountId) {
      return undefined
    }
    const controller = new AbortController()
    setState({ status: 'loading' })
    void loadUsage(accountId, controller.signal).then((next) => {
      if (next) {
        setState(next)
      }
    })
    return () => controller.abort()
  }, [open, accountId, refreshTick])

  const refresh = useCallback((): void => {
    setRefreshTick((n) => n + 1)
  }, [])

  return { state, refresh }
}

// Resolves to null when the request was aborted (dialog closed or account changed).
async function loadUsage(accountId: string, signal: AbortSignal): Promise<MetaUsageState | null> {
  try {
    const response = await fetch(`/api/meta-ads/usage?accountId=${encodeURIComponent(accountId)}`, {
      signal,
      cache: 'no-store',
    })
    if (response.ok) {
      const data = (await response.json()) as UsageResponse
      return { status: 'success', usage: data.usage, measuredAt: data.measuredAt }
    }
    const body = (await response.json().catch(() => ({}))) as ErrorResponse
    if (response.status === THROTTLED_STATUS && body.scope && typeof body.retryAfterSeconds === 'number') {
      return { status: 'throttled', scope: body.scope, retryAfterSeconds: body.retryAfterSeconds }
    }
    return { status: 'error', message: body.error ?? `HTTP ${response.status}` }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return null
    }
    return { status: 'error', message: err instanceof Error ? err.message : 'Unknown error' }
  }
}
