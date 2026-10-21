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
import type { CommerceProductsBreakdown, CommerceSalesRangeResult } from '../WooGateway'

export async function fetchSales(
  config: ShopifyProviderConfig,
  dateMin: string,
  dateMax: string,
  market: MarketSelection,
): Promise<CommerceSalesRangeResult> {
  const orders = filterOrdersByMarket(await fetchOrdersInRange(config, dateMin, dateMax), market)
  return deriveSalesRange(orders, config.currency)
}

export async function fetchProductsBreakdown(
  config: ShopifyProviderConfig,
  dateMin: string,
  dateMax: string,
  topLimit: number,
  market: MarketSelection,
): Promise<CommerceProductsBreakdown> {
  const orders = filterOrdersByMarket(await fetchOrdersInRange(config, dateMin, dateMax), market)
  const productCategoryMap = await fetchProductCategories(config, collectUniqueProductIds(orders))
  return {
    topProducts: deriveTopProducts(orders, topLimit),
    categoryRevenue: deriveCategoryRevenue(orders, productCategoryMap),
  }
}
