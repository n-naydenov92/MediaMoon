import 'server-only'
import type { KlaviyoProviderConfig } from '@/types/integrations'
import { readKlaviyoProvider } from '../source/db/connections'
import { readSecret } from './secrets'

export async function resolveKlaviyoConfig(brandId: string): Promise<KlaviyoProviderConfig | null> {
  const entry = await readKlaviyoProvider(brandId)
  const apiKey = entry ? readSecret(entry.apiKeyEnvVar) : null
  if (!entry || !apiKey) {
    return null
  }
  return { brandId: entry.brandId, apiKey, integrationName: entry.integrationName }
}
