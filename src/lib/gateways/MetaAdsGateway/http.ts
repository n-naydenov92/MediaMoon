const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'
const LIST_FETCH_TIMEOUT_MS = 30_000
const UPLOAD_FETCH_TIMEOUT_MS = 120_000
const RATE_LIMIT_ERROR_CODE = 17

export interface GraphErrorBody {
  error?: { message?: string; type?: string; code?: number }
}

export function buildUrl(path: string, token: string, params: Record<string, string>): string {
  const qs = new URLSearchParams({ ...params, access_token: token })
  return `${GRAPH_API_BASE}${path}?${qs.toString()}`
}

export async function callGraphApi<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LIST_FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      const parsed = parseGraphApiError(body)
      throw new Error(parsed ?? `Graph API HTTP ${response.status}: ${response.statusText}`)
    }
    return response.json() as Promise<T>
  } finally {
    clearTimeout(timer)
  }
}

export async function callGraphApiPost<T>(path: string, body: URLSearchParams): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LIST_FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(`${GRAPH_API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: controller.signal,
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Graph API HTTP ${response.status}: ${text}`)
    }
    return response.json() as Promise<T>
  } finally {
    clearTimeout(timer)
  }
}

export async function callGraphApiMultipart<T>(path: string, form: FormData): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPLOAD_FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(`${GRAPH_API_BASE}${path}`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Graph API HTTP ${response.status}: ${text}`)
    }
    return response.json() as Promise<T>
  } finally {
    clearTimeout(timer)
  }
}

function parseGraphApiError(body: string): string | null {
  if (!body) {
    return null
  }
  try {
    const json = JSON.parse(body) as GraphErrorBody
    const err = json.error
    if (!err) {
      return null
    }
    if (err.code === RATE_LIMIT_ERROR_CODE) {
      return 'Meta is rate-limiting this ad account. Wait ~1-2 minutes and try again.'
    }
    if (err.message) {
      return err.code !== undefined ? `Meta API error ${err.code}: ${err.message}` : err.message
    }
    return null
  } catch {
    return null
  }
}
