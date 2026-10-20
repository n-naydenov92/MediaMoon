const GRAPH_API_VERSION = process.env.META_GRAPH_VERSION ?? 'v25.0'
export const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`
const LIST_FETCH_TIMEOUT_MS = 30_000
const UPLOAD_FETCH_TIMEOUT_MS = 120_000
const RATE_LIMIT_ERROR_CODE = 17
// "Service temporarily unavailable" — what Meta's insights backend returns on heavy
// ad-level queries (e.g. subcode 1504043 "Intermittent Error"), documented as fixed
// by a plain retry. Rate-limit codes are excluded on purpose: retrying them only
// burns more of the quota that is already exhausted.
const TRANSIENT_ERROR_CODE = 2
const TRANSIENT_RETRY_DELAYS_MS = [1_000, 3_000] as const

export interface GraphErrorBody {
  error?: {
    message?: string
    type?: string
    code?: number
    error_user_title?: string
    error_user_msg?: string
  }
}

type GraphError = NonNullable<GraphErrorBody['error']>

class TransientGraphApiError extends Error {}

export function buildUrl(path: string, token: string, params: Record<string, string>): string {
  const qs = new URLSearchParams({ ...params, access_token: token })
  return `${GRAPH_API_BASE}${path}?${qs.toString()}`
}

// Only reads are retried — the POST helpers create Meta entities and are not idempotent.
export async function callGraphApi<T>(url: string): Promise<T> {
  let attempt = 0
  while (true) {
    try {
      return await callGraphApiOnce<T>(url)
    } catch (err) {
      const delayMs = TRANSIENT_RETRY_DELAYS_MS[attempt]
      if (!(err instanceof TransientGraphApiError) || delayMs === undefined) {
        throw err
      }
      await sleep(delayMs)
      attempt += 1
    }
  }
}

async function callGraphApiOnce<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LIST_FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw await toGraphApiError(response)
    }
    return await (response.json() as Promise<T>)
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
      throw await toGraphApiError(response)
    }
    return await (response.json() as Promise<T>)
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
      throw await toGraphApiError(response)
    }
    return await (response.json() as Promise<T>)
  } finally {
    clearTimeout(timer)
  }
}

async function toGraphApiError(response: Response): Promise<Error> {
  const body = await response.text().catch(() => '')
  const graphError = parseGraphError(body)
  const message = describeGraphError(graphError)
    ?? `Graph API HTTP ${response.status}: ${response.statusText}`
  return graphError?.code === TRANSIENT_ERROR_CODE
    ? new TransientGraphApiError(message)
    : new Error(message)
}

function parseGraphError(body: string): GraphError | null {
  if (!body) {
    return null
  }
  try {
    return (JSON.parse(body) as GraphErrorBody).error ?? null
  } catch {
    return null
  }
}

function describeGraphError(err: GraphError | null): string | null {
  if (!err) {
    return null
  }
  if (err.code === RATE_LIMIT_ERROR_CODE) {
    return 'Meta is rate-limiting this ad account. Wait ~1-2 minutes and try again.'
  }
  // error_user_msg is Meta's human-readable explanation (and error_user_title
  // its short heading) — far clearer than the generic "Invalid parameter"
  // message. Prefer it, falling back to message only when absent.
  if (err.error_user_msg) {
    return err.error_user_title
      ? `${err.error_user_title}: ${err.error_user_msg}`
      : err.error_user_msg
  }
  if (err.message) {
    return err.message
  }
  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
