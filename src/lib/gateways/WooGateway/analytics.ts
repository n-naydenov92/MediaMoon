import type { WooProviderConfig } from '@/types/commerce'
import type { DashboardTopProduct } from '@/types/dashboard'
import { buildAnalyticsUrl, wooGet } from './http'
import type { CategoryRevenuePoint, CommerceSalesRangeResult } from './types'

// WooCommerce Analytics — the reports behind WP admin → Analytics — reads pre-aggregated
// lookup tables: 1–8s for any range, where the legacy sales report took up to 45s cold
// and downloading every order took over a minute. Which order statuses count follows
// the store's Analytics "Excluded statuses" setting. Revenue is net (no shipping/tax).

const MAX_PER_PAGE = 100
const DAY_START_SUFFIX = 'T00:00:00'
const DAY_END_SUFFIX = 'T23:59:59'
const UNCATEGORIZED_LABEL = 'Uncategorized'

interface RevenueSubtotals {
  readonly orders_count?: number
  readonly net_revenue?: number
}

interface RevenueInterval {
  readonly interval: string
  readonly subtotals?: RevenueSubtotals
}

interface RevenueStats {
  readonly totals?: RevenueSubtotals
  readonly intervals?: readonly RevenueInterval[]
}

interface ProductRow {
  readonly product_id: number
  readonly items_sold?: number
  readonly net_revenue?: number
  readonly extended_info?: { readonly name?: string }
}

interface CategoryRow {
  readonly net_revenue?: number
  readonly extended_info?: { readonly name?: string }
}

export async function fetchRevenueStats(
  config: WooProviderConfig,
  dateMin: string,
  dateMax: string,
): Promise<CommerceSalesRangeResult> {
  const pages = await fetchRevenueStatsPages(config, dateMin, dateMax)
  const totals = pages[0]?.totals
  const byDay = pages
    .flatMap((page) => page.intervals ?? [])
    .map((i) => ({
      date: i.interval,
      revenue: i.subtotals?.net_revenue ?? 0,
      orders: i.subtotals?.orders_count ?? 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
  return {
    ordersCount: totals?.orders_count ?? 0,
    revenue: totals?.net_revenue ?? 0,
    currency: config.currency,
    byDay,
  }
}

export async function fetchTopProducts(
  config: WooProviderConfig,
  dateMin: string,
  dateMax: string,
  limit: number,
): Promise<readonly DashboardTopProduct[]> {
  const url = buildAnalyticsUrl(config, '/reports/products', {
    ...rangeParams(dateMin, dateMax),
    orderby: 'net_revenue',
    order: 'desc',
    per_page: String(limit),
    extended_info: 'true',
  })
  const { body } = await wooGet<readonly ProductRow[]>(config, url)
  return body.map((p) => ({
    productId: p.product_id,
    title: p.extended_info?.name ?? `#${p.product_id}`,
    quantity: p.items_sold ?? 0,
    revenue: p.net_revenue ?? 0,
  }))
}

// A product filed under several categories counts towards each, as in WP admin, so the
// categories can add up to more than the period's revenue.
export async function fetchCategoryRevenue(
  config: WooProviderConfig,
  dateMin: string,
  dateMax: string,
): Promise<readonly CategoryRevenuePoint[]> {
  const url = buildAnalyticsUrl(config, '/reports/categories', {
    ...rangeParams(dateMin, dateMax),
    orderby: 'net_revenue',
    order: 'desc',
    per_page: String(MAX_PER_PAGE),
    extended_info: 'true',
  })
  const { body } = await wooGet<readonly CategoryRow[]>(config, url)
  return body
    .map((c) => ({ category: c.extended_info?.name ?? UNCATEGORIZED_LABEL, revenue: c.net_revenue ?? 0 }))
    .filter((c) => c.revenue > 0)
}

// Daily intervals come at most 100 per page; ranges past that span extra pages.
async function fetchRevenueStatsPages(
  config: WooProviderConfig,
  dateMin: string,
  dateMax: string,
): Promise<readonly RevenueStats[]> {
  const pageUrl = (page: number): string => buildAnalyticsUrl(config, '/reports/revenue/stats', {
    ...rangeParams(dateMin, dateMax),
    interval: 'day',
    per_page: String(MAX_PER_PAGE),
    page: String(page),
  })
  const first = await wooGet<RevenueStats>(config, pageUrl(1))
  const totalPages = Number.parseInt(first.headers.get('x-wp-totalpages') ?? '1', 10) || 1
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => wooGet<RevenueStats>(config, pageUrl(i + 2))),
  )
  return [first, ...rest].map((r) => r.body)
}

function rangeParams(dateMin: string, dateMax: string): Record<string, string> {
  return { after: `${dateMin}${DAY_START_SUFFIX}`, before: `${dateMax}${DAY_END_SUFFIX}` }
}
