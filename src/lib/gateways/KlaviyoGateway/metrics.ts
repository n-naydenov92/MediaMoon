import type { KlaviyoProviderConfig } from '@/config/klaviyoProviders'
import { BASE_URL, klaviyoFetch } from './http'

const PLACED_ORDER_METRIC_NAME = 'Placed Order'

const placedOrderMetricCache = new Map<string, string | null>()

export async function getPlacedOrderMetricId(
  config: KlaviyoProviderConfig,
): Promise<string | null> {
  const cacheKey = `${config.apiKey}:${config.integrationName}`
  const cached = placedOrderMetricCache.get(cacheKey)
  if (cached !== undefined) {
    return cached
  }
  const id = await discoverPlacedOrderMetricId(config)
  placedOrderMetricCache.set(cacheKey, id)
  return id
}

async function discoverPlacedOrderMetricId(
  config: KlaviyoProviderConfig,
): Promise<string | null> {
  try {
    const params = new URLSearchParams()
    params.set('filter', `equals(integration.name,"${config.integrationName}")`)
    const url = `${BASE_URL}/metrics/?${params.toString()}`
    const res = await klaviyoFetch(config, url, { method: 'GET' })
    if (!res.ok) {
      return null
    }
    const json = (await res.json()) as MetricsListResponse
    const match = (json.data ?? []).find(
      (m) =>
        m.attributes?.name === PLACED_ORDER_METRIC_NAME
        && m.attributes?.integration?.name === config.integrationName,
    )
    return match?.id ?? null
  } catch {
    return null
  }
}

interface MetricsListResponse {
  readonly data?: readonly {
    readonly id: string
    readonly attributes?: {
      readonly name?: string
      readonly integration?: {
        readonly name?: string
      }
    }
  }[]
}
