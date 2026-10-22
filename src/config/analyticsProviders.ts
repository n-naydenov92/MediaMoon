import type { BrandId } from '@/types'

export interface AnalyticsProviderEntry {
  readonly brandId: BrandId
  readonly kind: 'ga4'
  readonly propertyEnvVar: string
  readonly timezone: string
}

export interface AnalyticsProviderConfig {
  readonly kind: 'ga4'
  readonly propertyId: string
  readonly timezone: string
}

const ANALYTICS_PROVIDERS: readonly AnalyticsProviderEntry[] = [
  {
    brandId: 'stoitchkov',
    kind: 'ga4',
    propertyEnvVar: 'GA_PROPERTY_ID_STOITCHKOV',
    timezone: 'Europe/Sofia',
  },
  {
    brandId: 'thegreenbear',
    kind: 'ga4',
    propertyEnvVar: 'GA_PROPERTY_ID_THEGREENBEAR',
    timezone: 'Europe/Sofia',
  },
  {
    brandId: 'sapphire',
    kind: 'ga4',
    propertyEnvVar: 'GA_PROPERTY_ID_SAPPHIRE',
    timezone: 'Europe/Sofia',
  },
]

export function getAnalyticsProviderEntry(brandId: string): AnalyticsProviderEntry | null {
  return ANALYTICS_PROVIDERS.find((p) => p.brandId === brandId) ?? null
}
