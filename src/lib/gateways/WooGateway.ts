import type { DashboardTopProduct } from '@/types/dashboard'
import type { WooProviderConfig } from '@/types/commerce'

const FETCH_TIMEOUT_MS = 30_000
const ORDERS_PER_PAGE = 100
const MAX_ORDERS_PAGES = 5

interface WooSalesReportEntry {
  readonly total_sales?: string | number
  readonly total_orders?: number
  readonly totals?: Record<string, { sales?: string | number; orders?: number }>
}

interface WooOrderLineItem {
  readonly product_id?: number
  readonly name?: string
  readonly quantity?: number
  readonly total?: string | number
}

interface WooOrder {
  readonly line_items?: readonly WooOrderLineItem[]
}

export interface WooSalesRangeResult {
  readonly ordersCount: number
  readonly revenue: number
  readonly currency: string
  readonly byDay: readonly { readonly date: string; readonly revenue: number; readonly orders: number }[]
}

export async function fetchSalesRange(
  config: WooProviderConfig,
  dateMin: string,
  dateMax: string,
): Promise<WooSalesRangeResult> {
  const url = buildUrl(config, '/reports/sales', { date_min: dateMin, date_max: dateMax })
  const payload = await wooFetch<readonly WooSalesReportEntry[]>(config, url)
  const entry = payload[0]
  return {
    ordersCount: typeof entry?.total_orders === 'number' ? entry.total_orders : 0,
    revenue: parseAmount(entry?.total_sales),
    currency: config.currency,
    byDay: parseByDay(entry?.totals),
  }
}

export async function fetchTopProductsByRevenue(
  config: WooProviderConfig,
  dateMin: string,
  dateMax: string,
  limit: number,
): Promise<DashboardTopProduct[]> {
  const after = `${dateMin}T00:00:00`
  const before = `${dateMax}T23:59:59`

  const pageNumbers = Array.from({ length: MAX_ORDERS_PAGES }, (_, i) => i + 1)
  const pages = await Promise.all(
    pageNumbers.map((page) =>
      wooFetch<readonly WooOrder[]>(
        config,
        buildUrl(config, '/orders', {
          after,
          before,
          status: 'processing,completed',
          per_page: String(ORDERS_PER_PAGE),
          page: String(page),
        }),
      ).catch(() => [] as readonly WooOrder[]),
    ),
  )

  const aggregate = new Map<number, { title: string; quantity: number; revenue: number }>()
  for (const orders of pages) {
    for (const order of orders) {
      for (const item of order.line_items ?? []) {
        if (typeof item.product_id !== 'number' || item.product_id === 0) {
          continue
        }
        const existing = aggregate.get(item.product_id) ?? {
          title: item.name ?? `#${item.product_id}`,
          quantity: 0,
          revenue: 0,
        }
        existing.quantity += item.quantity ?? 0
        existing.revenue += parseAmount(item.total)
        aggregate.set(item.product_id, existing)
      }
    }
  }

  return Array.from(aggregate.entries())
    .map(([productId, agg]) => ({ productId, ...agg }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

function buildUrl(
  config: WooProviderConfig,
  path: string,
  params: Record<string, string>,
): string {
  const qs = new URLSearchParams(params)
  return `${config.storeUrl}/wp-json/wc/v3${path}?${qs.toString()}`
}

async function wooFetch<T>(config: WooProviderConfig, url: string): Promise<T> {
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
      signal: controller.signal,
    })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`WooCommerce HTTP ${response.status}: ${body || response.statusText}`)
    }
    return (await response.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

function parseAmount(raw: unknown): number {
  if (typeof raw === 'number') {
    return raw
  }
  if (typeof raw === 'string') {
    const parsed = Number.parseFloat(raw)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function parseByDay(
  totals: Record<string, { sales?: string | number; orders?: number }> | undefined,
): readonly { readonly date: string; readonly revenue: number; readonly orders: number }[] {
  if (!totals) {
    return []
  }
  return Object.entries(totals)
    .map(([date, t]) => ({
      date,
      revenue: parseAmount(t.sales),
      orders: typeof t.orders === 'number' ? t.orders : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
