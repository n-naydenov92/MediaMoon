export interface ConversionOption {
  readonly value: string
  readonly label: string
  readonly group?: string
}

// Destination types confirmed by live Meta API responses. Multi-destination
// labels ("Website and app", "Website, app and in-store") shown in Ads Manager
// likely have their own enums too, but until we observe them we keep the list
// honest. The `resolveOption` fallback in ConversionSection shows unknown
// values as-is, and `isKnownDestination` locks editing for those cases.
// Order matters: items with the same group are rendered together by MUI
// Autocomplete in the order they appear here, so list Single first then Multiple.
export const DESTINATION_TYPE_OPTIONS: readonly ConversionOption[] = [
  { value: 'WEBSITE', label: 'Website', group: 'Single' },
  { value: 'APP', label: 'App', group: 'Single' },
  { value: 'MESSENGER', label: 'Message destinations', group: 'Single' },
  { value: 'PHONE_CALL', label: 'Calls', group: 'Single' },
  { value: 'WEBSITE_AND_PHONE_CALL', label: 'Website and calls', group: 'Multiple' },
]

const KNOWN_DESTINATION_VALUES: ReadonlySet<string> = new Set(
  DESTINATION_TYPE_OPTIONS.map((o) => o.value),
)

export function isKnownDestination(value: string): boolean {
  return value === '' || value === 'UNDEFINED' || KNOWN_DESTINATION_VALUES.has(value)
}

export const CUSTOM_EVENT_OPTIONS: readonly ConversionOption[] = [
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'ADD_TO_CART', label: 'Add to cart' },
  { value: 'INITIATE_CHECKOUT', label: 'Initiate checkout' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'COMPLETE_REGISTRATION', label: 'Complete registration' },
  { value: 'CONTACT', label: 'Contact' },
  { value: 'ADD_PAYMENT_INFO', label: 'Add payment info' },
  { value: 'ADD_TO_WISHLIST', label: 'Add to wishlist' },
  { value: 'VIEW_CONTENT', label: 'View content' },
  { value: 'SEARCH', label: 'Search' },
  { value: 'SUBSCRIBE', label: 'Subscribe' },
  { value: 'START_TRIAL', label: 'Start trial' },
  { value: 'DONATE', label: 'Donate' },
  { value: 'SUBMIT_APPLICATION', label: 'Submit application' },
  { value: 'SCHEDULE', label: 'Schedule' },
  { value: 'OTHER', label: 'Other' },
]

export const OPTIMIZATION_GOAL_OPTIONS: readonly ConversionOption[] = [
  { value: 'OFFSITE_CONVERSIONS', label: 'Conversions' },
  { value: 'VALUE', label: 'Value' },
  { value: 'LINK_CLICKS', label: 'Link clicks' },
  { value: 'LANDING_PAGE_VIEWS', label: 'Landing page views' },
  { value: 'IMPRESSIONS', label: 'Impressions' },
  { value: 'REACH', label: 'Reach' },
  { value: 'POST_ENGAGEMENT', label: 'Post engagement' },
  { value: 'THRUPLAY', label: 'ThruPlay' },
  { value: 'LEAD_GENERATION', label: 'Leads' },
  { value: 'APP_INSTALLS', label: 'App installs' },
]

export const BID_STRATEGY_OPTIONS: readonly ConversionOption[] = [
  { value: 'LOWEST_COST_WITHOUT_CAP', label: 'Highest volume (no cap)' },
  { value: 'LOWEST_COST_WITH_BID_CAP', label: 'Bid cap' },
  { value: 'COST_CAP', label: 'Cost cap' },
  { value: 'LOWEST_COST_WITH_MIN_ROAS', label: 'Minimum ROAS' },
]

export function resolveOption(
  list: readonly ConversionOption[],
  value: string,
): readonly ConversionOption[] {
  if (!value || list.some((o) => o.value === value)) {
    return list
  }
  return [...list, { value, label: value }]
}

export function bidStrategyNeedsAmount(strategy: string): boolean {
  return strategy === 'LOWEST_COST_WITH_BID_CAP' || strategy === 'COST_CAP'
}
