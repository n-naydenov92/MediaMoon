'use client'

import { useEffect, useState, type Dispatch } from 'react'
import type { AdSetDetail } from '@/lib/gateways/MetaAdsGateway'
import type { DraftAction } from './useAdSetDraft'
import { normalizeAdSetDetail } from './helpers'

interface FetchAdSetResponse {
  readonly result?: AdSetDetail
  readonly error?: string
}

interface UseAdSetSourceArgs {
  readonly open: boolean
  readonly isCreate: boolean
  readonly sourceAdSetId: string
  readonly accountId: string
  readonly dispatch: Dispatch<DraftAction>
}

export interface UseAdSetSourceResult {
  readonly source: AdSetDetail | null
  readonly loading: boolean
  readonly error: string | null
}

// Loads the source ad set in duplicate mode, normalizes legacy fields, and
// hydrates the draft. In create mode there is no source to fetch.
export function useAdSetSource({
  open,
  isCreate,
  sourceAdSetId,
  accountId,
  dispatch,
}: UseAdSetSourceArgs): UseAdSetSourceResult {
  const [source, setSource] = useState<AdSetDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || isCreate || !sourceAdSetId || !accountId) {
      setSource(null)
      setError(null)
      return undefined
    }
    const ctrl = new AbortController()
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const response = await fetch(
          `/api/meta-ads/adsets/${encodeURIComponent(sourceAdSetId)}?accountId=${encodeURIComponent(accountId)}`,
          { signal: ctrl.signal },
        )
        const json = (await response.json().catch(() => ({}))) as FetchAdSetResponse
        if (ctrl.signal.aborted) return
        if (!response.ok || !json.result) {
          throw new Error(json.error ?? `HTTP ${response.status}`)
        }
        const normalized = normalizeAdSetDetail(json.result)
        setSource(normalized)
        dispatch({ type: 'hydrate', source: normalized })
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Failed to load ad set')
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    })()
    return () => ctrl.abort()
  }, [open, isCreate, sourceAdSetId, accountId, dispatch])

  return { source, loading, error }
}
