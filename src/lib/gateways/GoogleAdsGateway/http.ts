// Bump when Google deprecates this Google Ads API version (~3 releases / year).
const API_VERSION = 'v21'
const API_BASE = `https://googleads.googleapis.com/${API_VERSION}`
const FETCH_TIMEOUT_MS = 30_000

export interface GoogleAdsAuth {
  readonly accessToken: string
  readonly developerToken: string
  readonly loginCustomerId: string
}

interface GoogleAdsErrorBody {
  error?: { message?: string; status?: string }
}

export async function callGoogleAdsSearch<T>(
  customerId: string,
  query: string,
  auth: GoogleAdsAuth,
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(`${API_BASE}/customers/${customerId}/googleAds:search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'developer-token': auth.developerToken,
        'login-customer-id': auth.loginCustomerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      const message = parseGoogleAdsError(body)
        ?? `Google Ads API HTTP ${response.status}: ${response.statusText}`
      throw new Error(message)
    }
    return await (response.json() as Promise<T>)
  } finally {
    clearTimeout(timer)
  }
}

function parseGoogleAdsError(body: string): string | null {
  if (!body) {
    return null
  }
  try {
    const json = JSON.parse(body) as GoogleAdsErrorBody
    return json.error?.message ?? null
  } catch {
    return null
  }
}
