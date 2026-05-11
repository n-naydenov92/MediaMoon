import type { WooProviderConfig } from '@/types/commerce'
import { buildUrl, chunkArray } from './parse'
import type { WooOrder, WooProduct } from './types'

const FETCH_TIMEOUT_MS = 30_000
const PRODUCTS_PER_PAGE = 100
const PRODUCT_FIELDS = 'id,categories'

export function collectUniqueProductIds(orders: readonly WooOrder[]): readonly number[] {
  const set = new Set<number>()
  for (const order of orders) {
    for (const item of order.line_items ?? []) {
      if (typeof item.product_id === 'number' && item.product_id > 0) {
        set.add(item.product_id)
      }
    }
  }
  return Array.from(set)
}

export async function fetchProductCategories(
  config: WooProviderConfig,
  productIds: readonly number[],
): Promise<ReadonlyMap<number, string>> {
  if (productIds.length === 0) {
    return new Map()
  }
  const chunks = chunkArray(productIds, PRODUCTS_PER_PAGE)
  const results = await Promise.all(
    chunks.map((chunk) => fetchProductsChunk(config, chunk).catch(() => [] as readonly WooProduct[])),
  )
  const map = new Map<number, string>()
  for (const products of results) {
    for (const product of products) {
      if (typeof product.id !== 'number' || product.id === 0) {
        continue
      }
      const primary = product.categories?.find((c) => c.name && c.name.length > 0)
      if (primary?.name) {
        map.set(product.id, primary.name)
      }
    }
  }
  return map
}

async function fetchProductsChunk(
  config: WooProviderConfig,
  ids: readonly number[],
): Promise<readonly WooProduct[]> {
  const url = buildUrl(config, '/products', {
    include: ids.join(','),
    per_page: String(PRODUCTS_PER_PAGE),
    _fields: PRODUCT_FIELDS,
  })
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
    return (await response.json()) as readonly WooProduct[]
  } finally {
    clearTimeout(timer)
  }
}
