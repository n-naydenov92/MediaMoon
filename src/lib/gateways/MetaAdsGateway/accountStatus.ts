// Meta's `account_status` is a numeric enum. This is the single place that maps it
// to a human label + a semantic tone, so the dashboard summary and the ad-creator
// account picker stay in sync when a code is added or relabelled.
export type AccountStatusTone = 'active' | 'inactive' | 'warn'

export interface AccountStatusInfo {
  readonly label: string
  readonly tone: AccountStatusTone
}

const ACCOUNT_STATUS: Record<number, AccountStatusInfo> = {
  1: { label: 'Active', tone: 'active' },
  2: { label: 'Disabled', tone: 'inactive' },
  3: { label: 'Unsettled', tone: 'warn' },
  7: { label: 'Pending review', tone: 'warn' },
  8: { label: 'Pending settlement', tone: 'warn' },
  9: { label: 'In grace period', tone: 'warn' },
  100: { label: 'Pending closure', tone: 'inactive' },
  101: { label: 'Closed', tone: 'inactive' },
}

export function accountStatusInfo(code: number): AccountStatusInfo {
  return ACCOUNT_STATUS[code] ?? { label: `Status ${code}`, tone: 'warn' }
}

// Only an Active (1) account can serve ads. Any other status — disabled, unsettled
// balance, in review, grace period, closed — makes Meta reject ad creation, so the
// creator flags it before the operator reaches Publish.
export function canAccountServeAds(code: number): boolean {
  return code === 1
}
