import type { BrandId } from './brands'

interface AnalyticsProviderEntry {
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

export function resolveAnalyticsProvider(brandId: BrandId): AnalyticsProviderConfig | null {
  const entry = ANALYTICS_PROVIDERS.find((p) => p.brandId === brandId)
  if (!entry) {
    return null
  }
  const propertyId = readEnv(entry.propertyEnvVar)
  if (!propertyId) {
    return null
  }
  return {
    kind: entry.kind,
    propertyId,
    timezone: entry.timezone,
  }
}

function readEnv(envVar: string): string | null {
  const value = process.env[envVar]
  return value && value.length > 0 ? value : null
}
