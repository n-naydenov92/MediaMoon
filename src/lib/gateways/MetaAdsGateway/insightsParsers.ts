import type { InsightsTotals, InsightsDailyPoint } from './types'

// Meta returns the same purchase under multiple action_type rows (e.g. both
// `purchase` and `omni_purchase` and `offsite_conversion.fb_pixel_purchase`).
// Summing all of them double-counts. `omni_purchase` is what Ads Manager UI
// shows as the canonical "Purchases" / "Purchase Conversion Value".
const PURCHASE_ACTION_TYPE = 'omni_purchase'
const ADD_TO_CART_ACTION_TYPE = 'omni_add_to_cart'
const INITIATE_CHECKOUT_ACTION_TYPE = 'omni_initiated_checkout'
const LANDING_PAGE_VIEW_ACTION_TYPE = 'landing_page_view'

export const INSIGHTS_FIELDS =
  'spend,impressions,clicks,inline_link_clicks,actions,action_values'

export interface GraphAction {
  action_type: string
  value: string
}

export interface GraphInsightsRow {
  date_start?: string
  date_stop?: string
  spend?: string
  impressions?: string
  clicks?: string
  inline_link_clicks?: string
  actions?: GraphAction[]
  action_values?: GraphAction[]
}

const EMPTY_TOTALS: InsightsTotals = {
  spend: 0,
  revenue: 0,
  purchases: 0,
  impressions: 0,
  clicks: 0,
  linkClicks: 0,
  landingPageViews: 0,
  addsToCart: 0,
  checkoutsInitiated: 0,
}

export function rowToTotals(row: GraphInsightsRow): InsightsTotals {
  return {
    spend: parseNumber(row.spend),
    revenue: sumActionsByType(row.action_values, PURCHASE_ACTION_TYPE),
    purchases: sumActionsByType(row.actions, PURCHASE_ACTION_TYPE),
    impressions: parseNumber(row.impressions),
    clicks: parseNumber(row.clicks),
    linkClicks: parseNumber(row.inline_link_clicks),
    landingPageViews: sumActionsByType(row.actions, LANDING_PAGE_VIEW_ACTION_TYPE),
    addsToCart: sumActionsByType(row.actions, ADD_TO_CART_ACTION_TYPE),
    checkoutsInitiated: sumActionsByType(row.actions, INITIATE_CHECKOUT_ACTION_TYPE),
  }
}

export function sumInsightsRows(rows: readonly GraphInsightsRow[]): InsightsTotals {
  return rows.reduce<InsightsTotals>((acc, row) => addTotals(acc, rowToTotals(row)), EMPTY_TOTALS)
}

export function toDailyPoint(row: GraphInsightsRow): InsightsDailyPoint {
  const totals = rowToTotals(row)
  return { date: row.date_start ?? '', ...totals }
}

function addTotals(a: InsightsTotals, b: InsightsTotals): InsightsTotals {
  return {
    spend: a.spend + b.spend,
    revenue: a.revenue + b.revenue,
    purchases: a.purchases + b.purchases,
    impressions: a.impressions + b.impressions,
    clicks: a.clicks + b.clicks,
    linkClicks: a.linkClicks + b.linkClicks,
    landingPageViews: a.landingPageViews + b.landingPageViews,
    addsToCart: a.addsToCart + b.addsToCart,
    checkoutsInitiated: a.checkoutsInitiated + b.checkoutsInitiated,
  }
}

function sumActionsByType(
  actions: readonly GraphAction[] | undefined,
  actionType: string,
): number {
  if (!actions) {
    return 0
  }
  return actions.reduce((acc, a) => {
    if (a.action_type === actionType) {
      return acc + parseNumber(a.value)
    }
    return acc
  }, 0)
}

function parseNumber(value: string | undefined): number {
  if (!value) {
    return 0
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}
