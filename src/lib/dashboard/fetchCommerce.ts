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

export interface CommerceFetchResult {
  readonly totals: CommerceTotals
  readonly topProducts: readonly DashboardTopProduct[]
  readonly categories: readonly CategoryBreakdownPoint[]
}

export async function fetchCommerceForBrand(
  brandId: BrandId,
  dateSelection: DateRangeSelection,
  market: MarketSelection,
): Promise<CommerceFetchResult | null> {
  const provider = resolveCommerceProvider(brandId)
  if (!provider) {
    return null
  }
  const range = rangeForCommerce(dateSelection, provider.timezone)
  const { sales, topProducts, categoryRevenue } =
    provider.kind === 'woocommerce'
      ? await WooGateway.fetchSalesAndProducts(
        provider,
        range.from,
        range.to,
        TOP_PRODUCTS_LIMIT,
        market,
      )
      : await ShopifyGateway.fetchSalesAndProducts(
        provider,
        range.from,
        range.to,
        TOP_PRODUCTS_LIMIT,
        market,
      )
  const totalCategoryRevenue = categoryRevenue.reduce((acc, p) => acc + p.revenue, 0)
  return {
    totals: {
      revenueEur: convertToEur(sales.revenue, sales.currency),
      ordersCount: sales.ordersCount,
      byDay: sales.byDay.map((p) => ({
        date: p.date,
        revenueEur: convertToEur(p.revenue, sales.currency),
        orders: p.orders,
      })),
    },
    topProducts: topProducts.map((p) => ({
      productId: p.productId,
      title: p.title,
      quantity: p.quantity,
      revenue: convertToEur(p.revenue, sales.currency),
      anchorAov: p.anchorAov === null ? null : convertToEur(p.anchorAov, sales.currency),
      anchorOrders: p.anchorOrders,
    })),
    categories: categoryRevenue.map((p) => ({
      category: p.category,
      revenue: convertToEur(p.revenue, sales.currency),
      share: totalCategoryRevenue > 0 ? p.revenue / totalCategoryRevenue : 0,
    })),
  }
}
