import type { MarketSelection } from '@/lib/markets'
import type { DashboardTopProduct } from '@/types/dashboard'
import { orderRevenue, parseAmount } from './parse'
import type { ShopifyOrder } from './types'
import type { CategoryRevenuePoint, CommerceSalesRangeResult } from '../WooGateway'

const UNCATEGORIZED_LABEL = 'Uncategorized'

export function filterOrdersByMarket(
  orders: readonly ShopifyOrder[],
  market: MarketSelection,
): readonly ShopifyOrder[] {
  if (market === 'ALL') {
    return orders
  }
  return orders.filter((o) => o.billing_address?.country_code === market)
}

export function deriveSalesRange(
  orders: readonly ShopifyOrder[],
  fallbackCurrency: string,
): CommerceSalesRangeResult {
  const byDayMap = new Map<string, { revenue: number; orders: number }>()
  let totalRevenue = 0
  for (const order of orders) {
    const date = (order.created_at ?? '').slice(0, 10)
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

export function deriveCategoryRevenue(
  orders: readonly ShopifyOrder[],
  productToCategory: ReadonlyMap<number, string>,
): readonly CategoryRevenuePoint[] {
  const totals = new Map<string, number>()
  for (const order of orders) {
    for (const item of order.line_items ?? []) {
      const id = typeof item.product_id === 'number' ? item.product_id : 0
      if (id === 0) {
        continue
      }
      const category = productToCategory.get(id) ?? UNCATEGORIZED_LABEL
      const amount = parseAmount(item.price) * (item.quantity ?? 0)
      totals.set(category, (totals.get(category) ?? 0) + amount)
    }
  }
  return Array.from(totals.entries())
    .map(([category, revenue]) => ({ category, revenue }))
    .filter((p) => p.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
}

interface ProductAgg {
  title: string
  quantity: number
  revenue: number
}

export function deriveTopProducts(
  orders: readonly ShopifyOrder[],
  limit: number,
): readonly DashboardTopProduct[] {
  const aggregate = new Map<number, ProductAgg>()
  for (const order of orders) {
    for (const item of order.line_items ?? []) {
      if (typeof item.product_id !== 'number' || item.product_id === 0) {
        continue
      }
      const existing = aggregate.get(item.product_id) ?? {
        title: item.title ?? `#${item.product_id}`,
        quantity: 0,
        revenue: 0,
      }
      const quantity = item.quantity ?? 0
      existing.quantity += quantity
      existing.revenue += parseAmount(item.price) * quantity
      aggregate.set(item.product_id, existing)
    }
  }
  return Array.from(aggregate.entries())
    .map(([productId, agg]) => ({
      productId,
      title: agg.title,
      quantity: agg.quantity,
      revenue: agg.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}
