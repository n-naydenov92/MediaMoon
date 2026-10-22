import { useEffect, useState } from 'react'
import type { BrandId } from '@/types'
import type { MarketSelection } from '@/lib/markets'
import type { DateRangeSelection } from '@/lib/meta/dateRange'
import { createSessionCache } from '@/lib/sessionCache'
import type { DashboardProducts } from '@/types/dashboard'
import { buildDashboardQuery } from './helpers'

export type DashboardProductsState =
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: DashboardProducts }
  | { readonly status: 'error'; readonly message: string }

const productsCache = createSessionCache<DashboardProducts>()

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

  useEffect(() => {
    const controller = new AbortController()
    const cacheKey = `${brandId}|${market}|${dateKey}`
    const cached = productsCache.get(cacheKey)
    if (cached) {
      setState({ status: 'success', data: cached })
      return () => controller.abort()
    }
    setState({ status: 'loading' })

    const search = buildDashboardQuery(brandId, dateSelection, market)
    void (async () => {
      try {
        const response = await fetch(`/api/brands/dashboard/products?${search}`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string }
          setState({ status: 'error', message: body.error ?? `HTTP ${response.status}` })
          return
        }
        const data = (await response.json()) as DashboardProducts
        productsCache.set(cacheKey, data)
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
