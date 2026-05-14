import type { ShopifyProviderConfig } from '@/types/commerce'
import { chunkArray } from './parse'
import { getShopifyAccessToken } from './tokenManager'
import type { ShopifyOrder } from './types'

const SHOPIFY_API_VERSION = '2024-10'
const FETCH_TIMEOUT_MS = 30_000
const PRODUCTS_PER_PAGE = 250
const PRODUCT_FIELDS = 'id,vendor'

interface ShopifyProduct {
  readonly id?: number
  readonly vendor?: string
}

export function collectUniqueProductIds(orders: readonly ShopifyOrder[]): readonly number[] {
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
  config: ShopifyProviderConfig,
  productIds: readonly number[],
): Promise<ReadonlyMap<number, string>> {
  if (productIds.length === 0) {
    return new Map()
  }
  const accessToken = await getShopifyAccessToken(config)
  const chunks = chunkArray(productIds, PRODUCTS_PER_PAGE)
  const results = await Promise.all(
    chunks.map((chunk) =>
      fetchProductsChunk(config, accessToken, chunk).catch(
        () => [] as readonly ShopifyProduct[],
      ),
    ),
  )
  const map = new Map<number, string>()
  for (const products of results) {
    for (const product of products) {
      if (typeof product.id !== 'number' || product.id === 0) {
        continue
      }
      if (product.vendor && product.vendor.length > 0) {
        map.set(product.id, product.vendor)
      }
    }
  }
  return map
}

async function fetchProductsChunk(
  config: ShopifyProviderConfig,
  accessToken: string,
  ids: readonly number[],
): Promise<readonly ShopifyProduct[]> {
  const params = new URLSearchParams({
    ids: ids.join(','),
    limit: String(PRODUCTS_PER_PAGE),
    fields: PRODUCT_FIELDS,
  })
  const url = `${config.storeUrl}/admin/api/${SHOPIFY_API_VERSION}/products.json?${params.toString()}`
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
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Shopify HTTP ${response.status}: ${body || response.statusText}`)
    }
    const json = (await response.json()) as { readonly products?: readonly ShopifyProduct[] }
    return json.products ?? []
  } finally {
    clearTimeout(timer)
  }
}
