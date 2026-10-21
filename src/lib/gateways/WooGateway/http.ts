import type { WooProviderConfig } from '@/types/commerce'

const DEFAULT_TIMEOUT_MS = 30_000

export interface WooResponse<T> {
  readonly body: T
  readonly headers: Headers
}

export function buildAnalyticsUrl(
  config: WooProviderConfig,
  path: string,
  params: Record<string, string>,
): string {
  const qs = new URLSearchParams(params)
  return `${config.storeUrl}/wp-json/wc-analytics${path}?${qs.toString()}`
}

export async function wooGet<T>(
  config: WooProviderConfig,
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<WooResponse<T>> {
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
      signal: controller.signal,
    })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`WooCommerce HTTP ${response.status}: ${body || response.statusText}`)
    }
    return { body: (await response.json()) as T, headers: response.headers }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`WooCommerce request timed out after ${timeoutMs / 1000}s`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
