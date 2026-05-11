import type { MarketSelection } from '@/lib/markets'
import type { ShopifyProviderConfig } from '@/types/commerce'
import { deriveSalesRange, deriveTopProducts, filterOrdersByMarket } from './derive'
import { fetchOrdersInRange } from './orders'
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
  return {
    sales: deriveSalesRange(orders, config.currency),
    topProducts: deriveTopProducts(orders, topLimit),
    categoryRevenue: [],
  }
}
