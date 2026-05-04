export type AdStatusKind = 'active' | 'paused' | 'inactive'

const FALLBACK_TOOLTIP = 'Inactive'

const META_STATUS_TOOLTIPS: Record<string, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CAMPAIGN_PAUSED: 'Campaign off',
  ADSET_PAUSED: 'Adset off',
  ARCHIVED: 'Archived',
  DELETED: 'Deleted',
  DISAPPROVED: 'Disapproved',
  WITH_ISSUES: 'With issues',
  IN_PROCESS: 'In review',
  PENDING_REVIEW: 'Pending review',
  PREAPPROVED: 'Pre-approved',
  PENDING_BILLING_INFO: 'Pending billing',
}

export function classifyAdStatus(raw: string): AdStatusKind {
  if (raw === 'ACTIVE') {
    return 'active'
  }
  if (raw === 'PAUSED') {
    return 'paused'
  }
  return 'inactive'
}

export function adStatusTooltip(raw: string): string {
  return META_STATUS_TOOLTIPS[raw] ?? FALLBACK_TOOLTIP
}
