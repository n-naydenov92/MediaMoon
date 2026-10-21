import type { ThrottleScope, UsageMeter } from '@/lib/gateways/MetaAdsGateway'

const WARNING_PCT = 80
const BLOCKED_PCT = 100
const MS_PER_MINUTE = 60_000
const SECONDS_PER_MINUTE = 60

export type MeterColor = 'primary' | 'warning' | 'error'

interface MeterCopy {
  readonly label: string
  readonly hint: string
}

const METER_COPY: Readonly<Record<string, MeterCopy>> = {
  adAccount: {
    label: 'Ad account · short-term',
    hint: 'Score for this ad account (read = 1, write = 3). At 100% Meta blocks it for about a minute.',
  },
  ads_management: {
    label: 'Ads management · hourly',
    hint: 'Uploads, creatives, ads and ad sets in this ad account.',
  },
  app: {
    label: 'App · all brands',
    hint: 'Shared by every brand. Full Access does not raise this one.',
  },
}

const METER_ORDER: readonly string[] = ['adAccount', 'ads_management', 'app']

const TIER_LABELS: Readonly<Record<string, string>> = {
  standard_access: 'Full Access',
  development_access: 'Limited Access',
}

export function meterCopy(key: string): MeterCopy {
  return METER_COPY[key] ?? { label: `${key.replace(/_/g, ' ')} · hourly`, hint: 'Business use case limit for this ad account.' }
}

export function sortMeters(meters: readonly UsageMeter[]): readonly UsageMeter[] {
  return [...meters].sort((a, b) => orderOf(a.key) - orderOf(b.key))
}

export function meterColor(pct: number): MeterColor {
  if (pct >= BLOCKED_PCT) {
    return 'error'
  }
  return pct >= WARNING_PCT ? 'warning' : 'primary'
}

export function progressValue(pct: number): number {
  return Math.min(Math.max(pct, 0), BLOCKED_PCT)
}

export function tierLabel(tier: string | null): string | undefined {
  return tier ? (TIER_LABELS[tier] ?? tier) : undefined
}

export function regainText(meter: UsageMeter): string | null {
  if (meter.regainMs <= 0) {
    return null
  }
  return `Blocked · access returns in about ${Math.max(1, Math.ceil(meter.regainMs / MS_PER_MINUTE))} min.`
}

export function throttledText(scope: ThrottleScope, retryAfterSeconds: number): string {
  const target = scope === 'app' ? 'the whole app (all brands)' : 'this ad account'
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / SECONDS_PER_MINUTE))
  return `Meta is limiting requests for ${target} right now. Try again in about ${minutes} min.`
}

export function formatMeasuredAt(measuredAt: number): string {
  return new Date(measuredAt).toLocaleTimeString()
}

function orderOf(key: string): number {
  const index = METER_ORDER.indexOf(key)
  return index === -1 ? METER_ORDER.length : index
}
