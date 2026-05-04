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
import type { Market } from '@/types'
import type { BrandId } from '@/config/brands'
import type { WindowResponse } from '@/app/api/meta-ads/window/route'
import { ALL_MARKETS } from '@/lib/markets'

const NO_TOKEN_STATUS = 503

export type MetaWindowState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'no-token' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'success'; readonly window: WindowResponse }

interface MetaWindowKey {
  readonly brandId: BrandId
  readonly market: Market | typeof ALL_MARKETS
}

interface ContextValue {
  readonly state: MetaWindowState
  readonly refresh: () => void
  readonly setKey: (key: MetaWindowKey) => void
}

const MetaWindowContext = createContext<ContextValue | null>(null)

export function useMetaWindow(): ContextValue {
  const ctx = useContext(MetaWindowContext)
  if (!ctx) {
    throw new Error('useMetaWindow must be used within MetaWindowProvider')
  }
  return ctx
}

interface ApiError {
  error?: string
}

interface Props {
  readonly children: ReactNode
}

export default function MetaWindowProvider({ children }: Props): JSX.Element {
  const [state, setState] = useState<MetaWindowState>({ status: 'idle' })
  const [key, setKeyState] = useState<MetaWindowKey | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const cacheRef = useRef<Map<string, WindowResponse>>(new Map())

  useEffect(() => {
    if (!key) {
      return
    }
    const cacheKey = serializeKey(key)
    const cached = refreshTick === 0 ? cacheRef.current.get(cacheKey) : undefined
    if (cached) {
      setState({ status: 'success', window: cached })
      return
    }
    const controller = new AbortController()
    setState({ status: 'loading' })
    void runFetch(key, controller.signal, refreshTick > 0).then((next) => {
      if (controller.signal.aborted) {
        return
      }
      if (next.status === 'success') {
        cacheRef.current.set(cacheKey, next.window)
      }
      setState(next)
    })
    return () => controller.abort()
  }, [key, refreshTick])

  const refresh = useCallback((): void => {
    setRefreshTick((n) => n + 1)
  }, [])

  const setKey = useCallback((next: MetaWindowKey): void => {
    setKeyState((prev) => {
      if (prev && prev.brandId === next.brandId && prev.market === next.market) {
        return prev
      }
      return next
    })
  }, [])

  const value = useMemo<ContextValue>(
    () => ({ state, refresh, setKey }),
    [state, refresh, setKey],
  )

  return <MetaWindowContext.Provider value={value}>{children}</MetaWindowContext.Provider>
}

function serializeKey(key: MetaWindowKey): string {
  return `${key.brandId}|${key.market}`
}

async function runFetch(
  key: MetaWindowKey,
  signal: AbortSignal,
  bypassCache: boolean,
): Promise<MetaWindowState> {
  const search = new URLSearchParams({ brandId: key.brandId })
  if (key.market !== ALL_MARKETS) {
    search.set('market', key.market)
  }
  try {
    const response = await fetch(`/api/meta-ads/window?${search.toString()}`, {
      signal,
      cache: bypassCache ? 'reload' : 'default',
    })
    if (response.status === NO_TOKEN_STATUS) {
      return { status: 'no-token' }
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as ApiError
      return { status: 'error', message: body.error ?? `HTTP ${response.status}` }
    }
    const data = (await response.json()) as WindowResponse
    return { status: 'success', window: data }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { status: 'idle' }
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { status: 'error', message }
  }
}
