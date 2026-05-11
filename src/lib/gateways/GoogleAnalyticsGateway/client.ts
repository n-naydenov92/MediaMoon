import { BetaAnalyticsDataClient } from '@google-analytics/data'

let cachedClient: BetaAnalyticsDataClient | null = null

export function getClient(): BetaAnalyticsDataClient {
  if (cachedClient) {
    return cachedClient
  }
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is not set')
  }
  const credentials = JSON.parse(raw) as Record<string, unknown>
  cachedClient = new BetaAnalyticsDataClient({ credentials, fallback: true })
  return cachedClient
}
