import 'server-only'
import type { AnalyticsProviderConfig } from '@/types/integrations'
import { readAnalyticsProvider } from '../source/db/connections'
import { readSecret } from './secrets'

export async function resolveAnalyticsConfig(brandId: string): Promise<AnalyticsProviderConfig | null> {
  const entry = await readAnalyticsProvider(brandId)
  const propertyId = entry ? readSecret(entry.propertyEnvVar) : null
  if (!entry || !propertyId) {
    return null
  }
  return { kind: entry.kind, propertyId, timezone: entry.timezone }
}
