import type { WooProviderConfig } from '@/types/commerce'
import type { WooOrder } from './types'

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

export function orderRevenue(order: WooOrder): number {
  return parseAmount(order.total) - parseAmount(order.shipping_total)
}

export function chunkArray<T>(items: readonly T[], size: number): readonly (readonly T[])[] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

export function buildUrl(
  config: WooProviderConfig,
  path: string,
  params: Record<string, string>,
): string {
  const qs = new URLSearchParams(params)
  return `${config.storeUrl}/wp-json/wc/v3${path}?${qs.toString()}`
}
