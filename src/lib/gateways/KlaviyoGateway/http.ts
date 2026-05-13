import type { KlaviyoProviderConfig } from '@/config/klaviyoProviders'

export const BASE_URL = 'https://a.klaviyo.com/api'
export const REVISION = '2024-10-15'

const FETCH_TIMEOUT_MS = 30_000
const MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY_MS = 1500

export async function klaviyoFetch(
  config: KlaviyoProviderConfig,
  url: string,
  init: RequestInit,
): Promise<Response> {
  let attempt = 0
  while (true) {
    const res = await singleAttempt(config, url, init)
    if (res.status !== 429 || attempt >= MAX_RETRIES) {
      return res
    }
    await res.text().catch(() => undefined)
    await sleep(retryDelayMs(res.headers.get('Retry-After'), attempt))
    attempt += 1
  }
}

async function singleAttempt(
  config: KlaviyoProviderConfig,
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, {
      ...init,
      headers: {
        Authorization: `Klaviyo-API-Key ${config.apiKey}`,
        revision: REVISION,
        accept: 'application/json',
        ...init.headers,
      },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

function retryDelayMs(retryAfterHeader: string | null, attempt: number): number {
  const parsed = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : NaN
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed * 1000
  }
  return DEFAULT_RETRY_DELAY_MS * (attempt + 1)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
