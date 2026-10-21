import { useEffect, useRef, useState } from 'react'
import type { BrandId } from '@/config/brands'
import type { MarketSelection } from '@/lib/markets'
import type { DateRangeSelection } from '@/lib/meta/dateRange'
import type { DashboardProducts } from '@/types/dashboard'
import { buildDashboardQuery } from './helpers'

export type DashboardProductsState =
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: DashboardProducts }
  | { readonly status: 'error'; readonly message: string }

interface ProductsQuery {
  readonly brandId: BrandId
  readonly market: MarketSelection
  readonly dateSelection: DateRangeSelection
  readonly dateKey: string
  readonly refreshTick: number
}

// Loaded separately from the summary: for Shopify brands it downloads every order, so it
// would otherwise hold back the KPIs and charts.
export function useDashboardProducts(query: ProductsQuery): DashboardProductsState {
  const { brandId, market, dateSelection, dateKey, refreshTick } = query
  const [state, setState] = useState<DashboardProductsState>({ status: 'loading' })
  const cacheRef = useRef<Map<string, DashboardProducts>>(new Map())

  useEffect(() => {
    const controller = new AbortController()
    const cacheKey = `${brandId}|${market}|${dateKey}`
    const cached = refreshTick === 0 ? cacheRef.current.get(cacheKey) : undefined
    setState(cached ? { status: 'success', data: cached } : { status: 'loading' })

    const search = buildDashboardQuery(brandId, dateSelection, market, refreshTick > 0)
    void (async () => {
      try {
        const response = await fetch(`/api/brands/dashboard/products?${search}`, {
          signal: controller.signal,
          cache: refreshTick > 0 ? 'reload' : 'default',
        })
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string }
          setState({ status: 'error', message: body.error ?? `HTTP ${response.status}` })
          return
        }
        const data = (await response.json()) as DashboardProducts
        cacheRef.current.set(cacheKey, data)
        setState({ status: 'success', data })
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        const message = err instanceof Error ? err.message : 'Unknown error'
        setState({ status: 'error', message })
      }
    })()

    return () => controller.abort()
  }, [brandId, market, dateKey, dateSelection, refreshTick])

  return state
}
