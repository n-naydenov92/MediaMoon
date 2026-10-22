import 'server-only'
import type { KlaviyoProviderConfig } from '@/config/klaviyoProviders'
import { readKlaviyoProvider } from '../source/configSource'
import { readSecret } from './secrets'

export async function resolveKlaviyoConfig(brandId: string): Promise<KlaviyoProviderConfig | null> {
  const entry = readKlaviyoProvider(brandId)
  const apiKey = entry ? readSecret(entry.apiKeyEnvVar) : null
  if (!entry || !apiKey) {
    return null
  }
  return { brandId: entry.brandId, apiKey, integrationName: entry.integrationName }
}
