import {
  MetaApiError,
  throttledError,
  toMetaApiError,
  unreachableError,
} from './graphErrors'
import {
  activeThrottle,
  logBlockedCall,
  logGraphCall,
  parseGraphUsage,
  recordThrottle,
} from './rateLimit'

const GRAPH_API_VERSION = process.env.META_GRAPH_VERSION ?? 'v25.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`
const GRAPH_VERSION_PREFIX = /^\/v\d+\.\d+/
const LIST_FETCH_TIMEOUT_MS = 30_000
const UPLOAD_FETCH_TIMEOUT_MS = 120_000
// Transient failures (e.g. code 2 "Service temporarily unavailable" — what Meta's insights
// backend returns on heavy ad-level queries, subcode 1504043) are documented as fixed by a
// plain retry. Throttles are excluded on purpose: retrying them only burns more of the
// quota that is already exhausted.
const TRANSIENT_RETRY_DELAYS_MS = [1_000, 3_000] as const

interface GraphCall {
  readonly method: string
  readonly path: string
}

interface GraphResult<T> {
  readonly body: T
  readonly headers: Headers
}

export function buildUrl(path: string, token: string, params: Record<string, string>): string {
  const qs = new URLSearchParams({ ...params, access_token: token })
  return `${GRAPH_API_BASE}${path}?${qs.toString()}`
}

export async function callGraphApi<T>(url: string): Promise<T> {
  const { body } = await callGraphApiWithHeaders<T>(url)
  return body
}

// Same read as callGraphApi, plus Meta's response headers, which carry the usage counters.
// Only reads are retried — the POST helpers create Meta entities and are not idempotent.
export async function callGraphApiWithHeaders<T>(url: string): Promise<GraphResult<T>> {
  let attempt = 0
  while (true) {
    try {
      return await sendGraphRequest<T>(url, { method: 'GET' }, LIST_FETCH_TIMEOUT_MS)
    } catch (err) {
      const delayMs = TRANSIENT_RETRY_DELAYS_MS[attempt]
      if (!isTransient(err) || delayMs === undefined) {
        throw err
      }
      await sleep(delayMs)
      attempt += 1
    }
  }
}

export async function callGraphApiPost<T>(path: string, body: URLSearchParams): Promise<T> {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  }
  const result = await sendGraphRequest<T>(`${GRAPH_API_BASE}${path}`, init, LIST_FETCH_TIMEOUT_MS)
  return result.body
}

export async function callGraphApiMultipart<T>(path: string, form: FormData): Promise<T> {
  const init: RequestInit = { method: 'POST', body: form }
  const result = await sendGraphRequest<T>(`${GRAPH_API_BASE}${path}`, init, UPLOAD_FETCH_TIMEOUT_MS)
  return result.body
}

async function sendGraphRequest<T>(url: string, init: RequestInit, timeoutMs: number): Promise<GraphResult<T>> {
  const call: GraphCall = { method: init.method ?? 'GET', path: graphPath(url) }
  const blocked = activeThrottle(call.path)
  if (blocked) {
    logBlockedCall({ ...call, throttle: blocked })
    throw throttledError(blocked)
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal }).catch(() => {
      throw unreachableError(controller.signal.aborted)
    })
    return await readGraphResponse<T>(response, call)
  } finally {
    clearTimeout(timer)
  }
}

async function readGraphResponse<T>(response: Response, call: GraphCall): Promise<GraphResult<T>> {
  const usage = parseGraphUsage(response.headers)
  const body = await readJsonBody(response)
  const error = toMetaApiError(response, body, usage)
  logGraphCall({ ...call, status: response.status, usage, throttle: error?.throttle ?? null })
  if (error?.throttle) {
    recordThrottle(call.path, error.throttle)
  }
  if (error) {
    throw error
  }
  return { body: body as T, headers: response.headers }
}

async function readJsonBody(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => '')
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function isTransient(err: unknown): boolean {
  return err instanceof MetaApiError && err.reason === 'transient'
}

// Host, Graph version and query string stripped — the query string carries the token,
// so this is the only form of the URL that is safe to log.
function graphPath(url: string): string {
  return new URL(url).pathname.replace(GRAPH_VERSION_PREFIX, '')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
