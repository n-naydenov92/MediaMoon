import type { DashboardTopProduct } from '@/types/dashboard'

export interface WooOrderLineItem {
  readonly product_id?: number
  readonly name?: string
  readonly quantity?: number
  readonly subtotal?: string | number
}

export interface WooProductCategory {
  readonly id?: number
  readonly name?: string
  readonly slug?: string
}

export interface WooProduct {
  readonly id?: number
  readonly categories?: readonly WooProductCategory[]
}

export interface WooOrder {
  readonly date_created?: string
  readonly currency?: string
  readonly total?: string | number
  readonly shipping_total?: string | number
  readonly line_items?: readonly WooOrderLineItem[]
  readonly billing?: { readonly country?: string }
}

export interface OrdersPage {
  readonly orders: readonly WooOrder[]
  readonly totalPages: number
}

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

export interface CommerceSalesAndProducts {
  readonly sales: CommerceSalesRangeResult
  readonly topProducts: readonly DashboardTopProduct[]
  readonly categoryRevenue: readonly CategoryRevenuePoint[]
}
