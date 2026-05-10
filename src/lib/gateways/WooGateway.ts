import type { DashboardTopProduct } from '@/types/dashboard'
import type { WooProviderConfig } from '@/types/commerce'

const FETCH_TIMEOUT_MS = 30_000
const ORDERS_PER_PAGE = 100
const PAGE_BATCH_SIZE = 30
const MAX_ORDERS_PAGES = 250
const DAY_START_SUFFIX = 'T00:00:00'
const DAY_END_SUFFIX = 'T23:59:59'
const PAID_STATUSES = 'processing,completed,on-hold,pending,failed'
const ORDER_FIELDS = 'date_created,currency,total,shipping_total,line_items'

interface WooOrderLineItem {
  readonly product_id?: number
  readonly name?: string
  readonly quantity?: number
  readonly subtotal?: string | number
}

interface WooOrder {
  readonly date_created?: string
  readonly currency?: string
  readonly total?: string | number
  readonly shipping_total?: string | number
  readonly line_items?: readonly WooOrderLineItem[]
}

export interface WooSalesRangeResult {
  readonly ordersCount: number
  readonly revenue: number
  readonly currency: string
  readonly byDay: readonly { readonly date: string; readonly revenue: number; readonly orders: number }[]
}

export interface WooSalesAndProducts {
  readonly sales: WooSalesRangeResult
  readonly topProducts: readonly DashboardTopProduct[]
}

export async function fetchSalesAndProducts(
  config: WooProviderConfig,
  dateMin: string,
  dateMax: string,
  topLimit: number,
): Promise<WooSalesAndProducts> {
  const orders = await fetchOrdersInRange(config, dateMin, dateMax)
  return {
    sales: deriveSalesRange(orders, config.currency),
    topProducts: deriveTopProducts(orders, topLimit),
  }
}

function deriveSalesRange(
  orders: readonly WooOrder[],
  fallbackCurrency: string,
): WooSalesRangeResult {
  const byDayMap = new Map<string, { revenue: number; orders: number }>()
  let totalRevenue = 0
  for (const order of orders) {
    const date = (order.date_created ?? '').slice(0, 10)
    if (!date) {
      continue
    }
    const amount = orderRevenue(order)
    totalRevenue += amount
    const existing = byDayMap.get(date) ?? { revenue: 0, orders: 0 }
    existing.revenue += amount
    existing.orders += 1
    byDayMap.set(date, existing)
  }
  const byDay = Array.from(byDayMap.entries())
    .map(([date, agg]) => ({ date, ...agg }))
    .sort((a, b) => a.date.localeCompare(b.date))
  return {
    ordersCount: orders.length,
    revenue: totalRevenue,
    currency: orders[0]?.currency ?? fallbackCurrency,
    byDay,
  }
}

function deriveTopProducts(
  orders: readonly WooOrder[],
  limit: number,
): readonly DashboardTopProduct[] {
  const aggregate = new Map<number, { title: string; quantity: number; revenue: number }>()
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
      existing.revenue += parseAmount(item.subtotal)
      aggregate.set(item.product_id, existing)
    }
  }
  return Array.from(aggregate.entries())
    .map(([productId, agg]) => ({ productId, ...agg }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

async function fetchOrdersInRange(
  config: WooProviderConfig,
  dateMin: string,
  dateMax: string,
): Promise<readonly WooOrder[]> {
  const after = `${dateMin}${DAY_START_SUFFIX}`
  const before = `${dateMax}${DAY_END_SUFFIX}`
  const buildPageUrl = (page: number): string =>
    buildUrl(config, '/orders', {
      after,
      before,
      status: PAID_STATUSES,
      per_page: String(ORDERS_PER_PAGE),
      page: String(page),
      _fields: ORDER_FIELDS,
    })
  const fetchPage = (page: number): Promise<OrdersPage> =>
    fetchOrdersPage(config, buildPageUrl(page))
      .catch(() => ({ orders: [] as readonly WooOrder[], totalPages: 0 }))

  const initialPages = Array.from({ length: PAGE_BATCH_SIZE }, (_, i) => i + 1)
  const initialResults = await Promise.all(initialPages.map(fetchPage))
  const totalPages = Math.min(
    initialResults.find((r) => r.totalPages > 0)?.totalPages ?? 1,
    MAX_ORDERS_PAGES,
  )
  const all: WooOrder[] = []
  for (const r of initialResults) {
    all.push(...r.orders)
  }
  for (let batchStart = PAGE_BATCH_SIZE + 1; batchStart <= totalPages; batchStart += PAGE_BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + PAGE_BATCH_SIZE - 1, totalPages)
    const batch = Array.from(
      { length: batchEnd - batchStart + 1 },
      (_, i) => batchStart + i,
    )
    const results = await Promise.all(batch.map(fetchPage))
    for (const r of results) {
      all.push(...r.orders)
    }
  }
  return all
}

interface OrdersPage {
  readonly orders: readonly WooOrder[]
  readonly totalPages: number
}

async function fetchOrdersPage(config: WooProviderConfig, url: string): Promise<OrdersPage> {
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
    const orders = (await response.json()) as readonly WooOrder[]
    const totalPagesRaw = response.headers.get('x-wp-totalpages') ?? '1'
    const totalPages = Number.parseInt(totalPagesRaw, 10) || 1
    return { orders, totalPages }
  } finally {
    clearTimeout(timer)
  }
}

function buildUrl(
  config: WooProviderConfig,
  path: string,
  params: Record<string, string>,
): string {
  const qs = new URLSearchParams(params)
  return `${config.storeUrl}/wp-json/wc/v3${path}?${qs.toString()}`
}

function orderRevenue(order: WooOrder): number {
  return parseAmount(order.total) - parseAmount(order.shipping_total)
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
