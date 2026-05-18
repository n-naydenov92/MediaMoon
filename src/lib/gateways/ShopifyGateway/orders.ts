import type { ShopifyProviderConfig } from '@/types/commerce'
import { parseCallLimit, parseNextPageInfo, sleep, timezoneOffsetForDate } from './parse'
import { getShopifyAccessToken } from './tokenManager'
import type { OrdersPage, ShopifyOrder } from './types'

const SHOPIFY_API_VERSION = '2024-10'
const FETCH_TIMEOUT_MS = 30_000
const ORDERS_PER_PAGE = 250
const MAX_PAGES = 200
const MIN_INTERVAL_MS = 600
const NEAR_LIMIT_RATIO = 0.8
const NEAR_LIMIT_BACKOFF_MS = 1_000
const RETRY_AFTER_FALLBACK_S = 2
const ORDER_FIELDS =
  'id,line_items,created_at,total_price,current_total_price,currency,billing_address'

export async function fetchOrdersInRange(
  config: ShopifyProviderConfig,
  dateMin: string,
  dateMax: string,
): Promise<readonly ShopifyOrder[]> {
  const accessToken = await getShopifyAccessToken(config)
  const initialUrl = buildInitialUrl(config, dateMin, dateMax)
  const all: ShopifyOrder[] = []
  let url: string | null = initialUrl
  let pagesFetched = 0
  let lastSentAt = 0

  while (url && pagesFetched < MAX_PAGES) {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastSentAt)
    if (wait > 0) {
      await sleep(wait)
    }
    lastSentAt = Date.now()

    const page = await fetchPage(accessToken, url)
    all.push(...page.orders)
    pagesFetched += 1

    if (
      page.callLimit
      && page.callLimit.cap > 0
      && page.callLimit.used / page.callLimit.cap > NEAR_LIMIT_RATIO
    ) {
      await sleep(NEAR_LIMIT_BACKOFF_MS)
    }

    url = page.nextPageInfo ? buildCursorUrl(config, page.nextPageInfo) : null
  }
  return all
}

async function fetchPage(
  accessToken: string,
  url: string,
): Promise<OrdersPage> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
    if (response.status === 429) {
      const retryAfter = Number.parseInt(
        response.headers.get('retry-after') ?? `${RETRY_AFTER_FALLBACK_S}`,
        10,
      )
      const wait = Number.isFinite(retryAfter) ? retryAfter : RETRY_AFTER_FALLBACK_S
      await sleep(wait * 1000)
      clearTimeout(timer)
      return await fetchPage(accessToken, url)
    }
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Shopify HTTP ${response.status}: ${body || response.statusText}`)
    }
    const json = (await response.json()) as { readonly orders?: readonly ShopifyOrder[] }
    return {
      orders: json.orders ?? [],
      nextPageInfo: parseNextPageInfo(response.headers.get('link')),
      callLimit: parseCallLimit(response.headers.get('x-shopify-shop-api-call-limit')),
    }
  } finally {
    clearTimeout(timer)
  }
}

function buildInitialUrl(
  config: ShopifyProviderConfig,
  dateMin: string,
  dateMax: string,
): string {
  const offsetMin = timezoneOffsetForDate(dateMin, config.timezone)
  const offsetMax = timezoneOffsetForDate(dateMax, config.timezone)
  const params = new URLSearchParams({
    status: 'any',
    created_at_min: `${dateMin}T00:00:00.000${offsetMin}`,
    created_at_max: `${dateMax}T23:59:59.999${offsetMax}`,
    limit: String(ORDERS_PER_PAGE),
    fields: ORDER_FIELDS,
  })
  return `${config.storeUrl}/admin/api/${SHOPIFY_API_VERSION}/orders.json?${params.toString()}`
}

function buildCursorUrl(config: ShopifyProviderConfig, pageInfo: string): string {
  const params = new URLSearchParams({
    limit: String(ORDERS_PER_PAGE),
    fields: ORDER_FIELDS,
    page_info: pageInfo,
  })
  return `${config.storeUrl}/admin/api/${SHOPIFY_API_VERSION}/orders.json?${params.toString()}`
}
