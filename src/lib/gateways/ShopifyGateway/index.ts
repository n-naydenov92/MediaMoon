import type { MarketSelection } from '@/lib/markets'
import type { ShopifyProviderConfig } from '@/types/commerce'
import {
  deriveCategoryRevenue,
  deriveSalesRange,
  deriveTopProducts,
  filterOrdersByMarket,
} from './derive'
import { fetchOrdersInRange } from './orders'
import { collectUniqueProductIds, fetchProductCategories } from './products'
import type { CommerceSalesAndProducts } from '../WooGateway'

export async function fetchSalesAndProducts(
  config: ShopifyProviderConfig,
  dateMin: string,
  dateMax: string,
  topLimit: number,
  market: MarketSelection,
): Promise<CommerceSalesAndProducts> {
  const allOrders = await fetchOrdersInRange(config, dateMin, dateMax)
  const orders = filterOrdersByMarket(allOrders, market)
  const uniqueProductIds = collectUniqueProductIds(orders)
  const productCategoryMap = await fetchProductCategories(config, uniqueProductIds)
  return {
    sales: deriveSalesRange(orders, config.currency),
    topProducts: deriveTopProducts(orders, topLimit),
    categoryRevenue: deriveCategoryRevenue(orders, productCategoryMap),
  }
}
