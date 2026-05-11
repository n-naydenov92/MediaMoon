interface ShopifyMoney {
  readonly amount?: string | number
  readonly currency_code?: string
}

export interface ShopifyMoneySet {
  readonly shop_money?: ShopifyMoney
  readonly presentment_money?: ShopifyMoney
}

export interface ShopifyLineItem {
  readonly product_id?: number | null
  readonly title?: string
  readonly quantity?: number
  readonly price?: string | number
}

export interface ShopifyOrder {
  readonly created_at?: string
  readonly currency?: string
  readonly total_price?: string | number
  readonly total_shipping_price_set?: ShopifyMoneySet
  readonly line_items?: readonly ShopifyLineItem[]
  readonly billing_address?: { readonly country_code?: string }
}

export interface CallLimit {
  readonly used: number
  readonly cap: number
}

export interface OrdersPage {
  readonly orders: readonly ShopifyOrder[]
  readonly nextPageInfo: string | null
  readonly callLimit: CallLimit | null
}
