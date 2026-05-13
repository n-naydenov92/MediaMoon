'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import CreativePreviewCard from './CreativePreviewCard'
import { parseCreativeResponse } from './parseCreativeResponse'
import type { CreativePreviewState } from './creativePreviewTypes'

const HOVER_OPEN_DELAY_MS = 320
const HOVER_CLOSE_DELAY_MS = 180

interface ContextValue {
  readonly requestOpen: (adId: string, accountId: string, anchor: HTMLElement) => void
  readonly requestClose: () => void
  readonly cancelClose: () => void
  readonly requestOpenImmediate: (adId: string, accountId: string, anchor: HTMLElement) => void
  readonly requestCloseImmediate: () => void
}

const CreativePreviewControlContext = createContext<ContextValue | null>(null)

export function useCreativePreviewControl(): ContextValue {
  const ctx = useContext(CreativePreviewControlContext)
  if (!ctx) {
    throw new Error('useCreativePreviewControl must be used within CreativePreviewProvider')
  }
  return ctx
}

interface Props {
  readonly children: ReactNode
}

export default function CreativePreviewProvider({ children }: Props): JSX.Element {
  const [openAdId, setOpenAdId] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [state, setState] = useState<CreativePreviewState>({ status: 'idle' })

  const cacheRef = useRef<Map<string, CreativePreviewState>>(new Map())
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef<Map<string, AbortController>>(new Map())

  const clearTimers = useCallback((): void => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const fetchCreative = useCallback(
    async (adId: string, accountId: string): Promise<void> => {
      const cached = cacheRef.current.get(adId)
      if (cached && cached.status === 'success') {
        return
      }
      const existing = inFlightRef.current.get(adId)
      if (existing) {
        return
      }
      const controller = new AbortController()
      inFlightRef.current.set(adId, controller)
      cacheRef.current.set(adId, { status: 'loading' })
      // eslint-disable-next-line @typescript-eslint/no-use-before-define -- function defined later in file
      setState((prev) => (openAdIdRef.current === adId ? { status: 'loading' } : prev))

      try {
        const url = `/api/meta-ads/insights?accountId=${encodeURIComponent(accountId)}&adId=${encodeURIComponent(adId)}`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const raw = await res.json()
        const adError = (raw?.ad as { error?: { code?: number; message?: string } } | undefined)?.error
        if (adError) {
          if (adError.code === 17) {
            throw new Error(
              'Meta is rate-limiting this ad account. Wait ~1 minute and hover again.',
            )
          }
          throw new Error(adError.message ?? 'Meta API error')
        }
        const parsed = parseCreativeResponse(adId, raw)
        if (!parsed.hasContent) {
          // eslint-disable-next-line no-console
          console.warn('[CreativePreview] no extractable content for', adId, raw)
        } else if (!parsed.data.body && !parsed.data.headline) {
          // eslint-disable-next-line no-console
          console.info('[CreativePreview] body+headline missing for', adId, raw)
        }
        const next: CreativePreviewState = parsed.hasContent
          ? { status: 'success', data: parsed.data }
          : { status: 'no-content', data: parsed.data }
        cacheRef.current.set(adId, next)
        // eslint-disable-next-line @typescript-eslint/no-use-before-define -- function defined later in file
        setState((prev) => (openAdIdRef.current === adId ? next : prev))
      } catch (err) {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : 'Failed to load preview'
        const fail: CreativePreviewState = { status: 'error', message }
        cacheRef.current.set(adId, fail)
        // eslint-disable-next-line @typescript-eslint/no-use-before-define -- function defined later in file
        setState((prev) => (openAdIdRef.current === adId ? fail : prev))
      } finally {
        inFlightRef.current.delete(adId)
      }
    },
    [],
  )

  const openAdIdRef = useRef<string | null>(null)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- legacy pattern
    openAdIdRef.current = openAdId
  }, [openAdId])

  const requestOpen = useCallback(
    (adId: string, accountId: string, nextAnchor: HTMLElement): void => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      if (openAdIdRef.current === adId) {
        setAnchor(nextAnchor)
        return
      }
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current)
      }
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null
        setOpenAdId(adId)
        setAnchor(nextAnchor)
        const cached = cacheRef.current.get(adId)
        if (cached) {
          setState(cached)
          return
        }
        setState({ status: 'loading' })
        void fetchCreative(adId, accountId)
      }, HOVER_OPEN_DELAY_MS)
    },
    [fetchCreative],
  )

  const requestClose = useCallback((): void => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
    if (closeTimerRef.current) return
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null
      setOpenAdId(null)
      setAnchor(null)
      setState({ status: 'idle' })
    }, HOVER_CLOSE_DELAY_MS)
  }, [])

  const cancelClose = useCallback((): void => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const requestOpenImmediate = useCallback(
    (adId: string, accountId: string, nextAnchor: HTMLElement): void => {
      clearTimers()
      setOpenAdId(adId)
      setAnchor(nextAnchor)
      const cached = cacheRef.current.get(adId)
      if (cached) {
        setState(cached)
        return
      }
      setState({ status: 'loading' })
      void fetchCreative(adId, accountId)
    },
    [clearTimers, fetchCreative],
  )

  const requestCloseImmediate = useCallback((): void => {
    clearTimers()
    setOpenAdId(null)
    setAnchor(null)
    setState({ status: 'idle' })
  }, [clearTimers])

  useEffect(() => () => {
    clearTimers()
    inFlightRef.current.forEach((c) => c.abort())
    inFlightRef.current.clear()
  }, [clearTimers])

  const value = useMemo<ContextValue>(
    () => ({ requestOpen, requestClose, cancelClose, requestOpenImmediate, requestCloseImmediate }),
    [requestOpen, requestClose, cancelClose, requestOpenImmediate, requestCloseImmediate],
  )

  return (
    <CreativePreviewControlContext.Provider value={value}>
      {children}
      <CreativePreviewCard
        anchor={anchor}
        state={state}
        onPointerEnter={cancelClose}
        onPointerLeave={requestClose}
        onClose={requestCloseImmediate}
      />
    </CreativePreviewControlContext.Provider>
  )
}
