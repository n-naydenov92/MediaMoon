import 'server-only'
import type { AnalyticsProviderConfig } from '@/config/analyticsProviders'
import { activeSource } from '../source/activeSource'
import { readSecret } from './secrets'

export async function resolveAnalyticsConfig(brandId: string): Promise<AnalyticsProviderConfig | null> {
  const entry = await activeSource.readAnalyticsProvider(brandId)
  const propertyId = entry ? readSecret(entry.propertyEnvVar) : null
  if (!entry || !propertyId) {
    return null
  }
  return { kind: entry.kind, propertyId, timezone: entry.timezone }
}
