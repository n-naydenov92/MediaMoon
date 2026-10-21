import type { WooProviderConfig } from '@/types/commerce'
import { fetchCategoryRevenue, fetchTopProducts } from './analytics'
import type { CommerceProductsBreakdown } from './types'

export type {
  CategoryRevenuePoint,
  CommerceProductsBreakdown,
  CommerceSalesRangeResult,
} from './types'

export { fetchRevenueStats } from './analytics'

export async function fetchProductsBreakdown(
  config: WooProviderConfig,
  dateMin: string,
  dateMax: string,
  topLimit: number,
): Promise<CommerceProductsBreakdown> {
  const [topProducts, categoryRevenue] = await Promise.all([
    fetchTopProducts(config, dateMin, dateMax, topLimit),
    fetchCategoryRevenue(config, dateMin, dateMax),
  ])
  return { topProducts, categoryRevenue }
}
