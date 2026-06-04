import type { CtaType } from '@/lib/gateways/MetaAdsGateway'

export interface CtaOption {
  readonly id: CtaType
  readonly label: string
}

// Single source of truth for the call-to-action choices, shared by the copy
// form (select options) and the ad preview (rendered button label).
export const CTA_OPTIONS: readonly CtaOption[] = [
  { id: 'LEARN_MORE', label: 'Learn more' },
  { id: 'SHOP_NOW', label: 'Shop now' },
  { id: 'SIGN_UP', label: 'Sign up' },
]

export const CTA_LABELS = Object.fromEntries(
  CTA_OPTIONS.map((option) => [option.id, option.label]),
) as Record<CtaType, string>
