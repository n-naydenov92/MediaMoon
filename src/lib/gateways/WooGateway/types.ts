import type { DashboardTopProduct } from '@/types/dashboard'

export interface CommerceSalesRangeResult {
  readonly ordersCount: number
  readonly revenue: number
  readonly currency: string
  readonly byDay: readonly { readonly date: string; readonly revenue: number; readonly orders: number }[]
}

export interface CategoryRevenuePoint {
  readonly category: string
  readonly revenue: number
}

export interface CommerceProductsBreakdown {
  readonly topProducts: readonly DashboardTopProduct[]
  readonly categoryRevenue: readonly CategoryRevenuePoint[]
}
