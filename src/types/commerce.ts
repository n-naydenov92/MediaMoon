/**
 * Commerce types — source-agnostic shape exposed to the UI.
 * Whether the underlying store is WooCommerce or Shopify, the API and
 * components see the same `CommerceDailyStats`.
 */

export interface CommerceDailyStats {
  readonly ordersCount: number
  readonly revenue: number
  readonly currency: string
  readonly fetchedAt: string
}

export interface WooProviderConfig {
  readonly kind: 'woocommerce'
  readonly storeUrl: string
  readonly consumerKey: string
  readonly consumerSecret: string
  readonly currency: string
  readonly timezone: string
}

export interface ShopifyProviderConfig {
  readonly kind: 'shopify'
  readonly storeUrl: string
  readonly clientId: string
  readonly clientSecret: string
  readonly currency: string
  readonly timezone: string
}

export type CommerceProviderConfig = WooProviderConfig | ShopifyProviderConfig
