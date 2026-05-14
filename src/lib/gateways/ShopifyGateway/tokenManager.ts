import type { ShopifyProviderConfig } from '@/types/commerce'

interface CachedToken {
  readonly token: string
  readonly expiresAt: number
}

const REFRESH_BUFFER_MS = 60_000
const DEFAULT_TOKEN_TTL_S = 86_400

const globalForCache = globalThis as unknown as {
  __shopifyTokenCache?: Map<string, CachedToken>
}
if (!globalForCache.__shopifyTokenCache) {
  globalForCache.__shopifyTokenCache = new Map<string, CachedToken>()
}
const cache = globalForCache.__shopifyTokenCache

export async function getShopifyAccessToken(
  config: ShopifyProviderConfig,
): Promise<string> {
  const cacheKey = `${config.storeUrl}|${config.clientId}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt - REFRESH_BUFFER_MS) {
    return cached.token
  }
  const response = await fetch(`${config.storeUrl}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'client_credentials',
    }),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(
      `Shopify token grant HTTP ${response.status}: ${body || response.statusText}`,
    )
  }
  const data = (await response.json()) as {
    readonly access_token?: string
    readonly expires_in?: number
  }
  if (!data.access_token) {
    throw new Error('Shopify token grant: missing access_token in response')
  }
  const ttlSeconds = data.expires_in ?? DEFAULT_TOKEN_TTL_S
  cache.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
  return data.access_token
}
