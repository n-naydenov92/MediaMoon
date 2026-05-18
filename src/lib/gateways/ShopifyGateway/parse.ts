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
  // current_total_price already nets out refunds, returns and order edits, and
  // includes shipping + tax — the same basis as Shopify's "Total sales" metric.
  if (order.current_total_price !== undefined) {
    return parseAmount(order.current_total_price)
  }
  return parseAmount(order.total_price)
}

export function timezoneOffsetForDate(dateStr: string, timezone: string): string {
  // Noon side-steps the DST-transition hour, where a midnight reference is ambiguous.
  const reference = new Date(`${dateStr}T12:00:00Z`)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  }).formatToParts(reference)
  const offsetName = parts.find((part) => part.type === 'timeZoneName')?.value ?? ''
  const match = offsetName.match(/GMT([+-]\d{2}:\d{2})/)
  return match?.[1] ?? '+00:00'
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

export function chunkArray<T>(items: readonly T[], size: number): readonly (readonly T[])[] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}
