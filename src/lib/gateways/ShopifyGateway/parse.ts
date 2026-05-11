import type { CallLimit, ShopifyOrder } from './types'

export function parseAmount(raw: unknown): number {
  if (typeof raw === 'number') {
    return raw
  }
  if (typeof raw === 'string') {
    const parsed = Number.parseFloat(raw)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export function orderRevenue(order: ShopifyOrder): number {
  const total = parseAmount(order.total_price)
  const shipping = parseAmount(order.total_shipping_price_set?.shop_money?.amount)
  return total - shipping
}

export function parseNextPageInfo(linkHeader: string | null): string | null {
  if (!linkHeader) {
    return null
  }
  for (const part of linkHeader.split(',')) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/)
    const captured = match?.[1]
    if (captured) {
      const nextUrl = new URL(captured)
      return nextUrl.searchParams.get('page_info')
    }
  }
  return null
}

export function parseCallLimit(raw: string | null): CallLimit | null {
  if (!raw) {
    return null
  }
  const [usedRaw, capRaw] = raw.split('/')
  const used = Number.parseInt(usedRaw ?? '', 10)
  const cap = Number.parseInt(capRaw ?? '', 10)
  if (!Number.isFinite(used) || !Number.isFinite(cap)) {
    return null
  }
  return { used, cap }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
