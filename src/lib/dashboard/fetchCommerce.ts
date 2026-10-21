import type { BrandId } from '@/config/brands'
import { rangeForCommerce } from '@/lib/commerce/rangeInTimezone'
import { resolveCommerceProvider } from '@/lib/commerce/resolveProvider'
import * as ShopifyGateway from '@/lib/gateways/ShopifyGateway'
import * as WooGateway from '@/lib/gateways/WooGateway'
import type { MarketSelection } from '@/lib/markets'
import { convertToEur } from '@/lib/meta/fx'
import type { DateRangeSelection } from '@/lib/meta/dateRange'
import type { CategoryBreakdownPoint, DashboardTopProduct } from '@/types/dashboard'
import type { CommerceTotals } from './aggregate'

const TOP_PRODUCTS_LIMIT = 15

// WooCommerce Analytics can't filter by billing country, so Woo brands ignore `market`.
// Every Woo brand is single-market, and "All markets" is the sum of a brand's markets —
// for them the same orders either way.

export interface CommerceProductsResult {
  readonly topProducts: readonly DashboardTopProduct[]
  readonly categories: readonly CategoryBreakdownPoint[]
}

export async function fetchCommerceTotalsForBrand(
  brandId: BrandId,
  dateSelection: DateRangeSelection,
  market: MarketSelection,
): Promise<CommerceTotals | null> {
  const provider = resolveCommerceProvider(brandId)
  if (!provider) {
    return null
  }
  const range = rangeForCommerce(dateSelection, provider.timezone)
  const sales = provider.kind === 'woocommerce'
    ? await WooGateway.fetchRevenueStats(provider, range.from, range.to)
    : await ShopifyGateway.fetchSales(provider, range.from, range.to, market)
  return {
    revenueEur: convertToEur(sales.revenue, sales.currency),
    ordersCount: sales.ordersCount,
    byDay: sales.byDay.map((p) => ({
      date: p.date,
      revenueEur: convertToEur(p.revenue, sales.currency),
      orders: p.orders,
    })),
  }
}

export async function fetchCommerceProductsForBrand(
  brandId: BrandId,
  dateSelection: DateRangeSelection,
  market: MarketSelection,
): Promise<CommerceProductsResult | null> {
  const provider = resolveCommerceProvider(brandId)
  if (!provider) {
    return null
  }
  const range = rangeForCommerce(dateSelection, provider.timezone)
  const { topProducts, categoryRevenue } = provider.kind === 'woocommerce'
    ? await WooGateway.fetchProductsBreakdown(provider, range.from, range.to, TOP_PRODUCTS_LIMIT)
    : await ShopifyGateway.fetchProductsBreakdown(provider, range.from, range.to, TOP_PRODUCTS_LIMIT, market)
  const { currency } = provider
  const totalCategoryRevenue = categoryRevenue.reduce((acc, p) => acc + p.revenue, 0)
  return {
    topProducts: topProducts.map((p) => ({
      productId: p.productId,
      title: p.title,
      quantity: p.quantity,
      revenue: convertToEur(p.revenue, currency),
    })),
    categories: categoryRevenue.map((p) => ({
      category: p.category,
      revenue: convertToEur(p.revenue, currency),
      share: totalCategoryRevenue > 0 ? p.revenue / totalCategoryRevenue : 0,
    })),
  }
}
