import type { WooProviderConfig } from '@/types/commerce'
import { buildUrl } from './parse'
import type { OrdersPage, WooOrder } from './types'

const FETCH_TIMEOUT_MS = 30_000
const ORDERS_PER_PAGE = 100
const PAGE_BATCH_SIZE = 30
const MAX_ORDERS_PAGES = 250
const DAY_START_SUFFIX = 'T00:00:00'
const DAY_END_SUFFIX = 'T23:59:59'
const PAID_STATUSES = 'processing,completed,on-hold,pending,failed'
const ORDER_FIELDS = 'date_created,currency,total,shipping_total,line_items,billing'

export async function fetchOrdersInRange(
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
  for (
    let batchStart = PAGE_BATCH_SIZE + 1;
    batchStart <= totalPages;
    batchStart += PAGE_BATCH_SIZE
  ) {
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
