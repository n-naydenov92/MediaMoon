import type { BrandId } from '@/config/brands'
import { rangeForCommerce } from '@/lib/commerce/rangeInTimezone'
import { resolveCommerceProvider } from '@/lib/commerce/resolveProvider'
import { fetchSalesAndProducts } from '@/lib/gateways/WooGateway'
import { convertToEur } from '@/lib/meta/fx'
import type { DateRangeSelection } from '@/lib/meta/dateRange'
import type { DashboardTopProduct } from '@/types/dashboard'
import type { CommerceTotals } from './aggregate'

const TOP_PRODUCTS_LIMIT = 5

export interface CommerceFetchResult {
  readonly totals: CommerceTotals
  readonly topProducts: readonly DashboardTopProduct[]
}

export async function fetchCommerceForBrand(
  brandId: BrandId,
  dateSelection: DateRangeSelection,
): Promise<CommerceFetchResult | null> {
  const provider = resolveCommerceProvider(brandId)
  if (!provider) {
    return null
  }
  const range = rangeForCommerce(dateSelection, provider.timezone)
  const { sales, topProducts } = await fetchSalesAndProducts(
    provider,
    range.from,
    range.to,
    TOP_PRODUCTS_LIMIT,
  )
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
    })),
  }
}
