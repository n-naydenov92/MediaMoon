import { throttledError, toMetaApiError, unreachableError } from './graphErrors'
import {
  activeThrottle,
  logBlockedCall,
  logGraphCall,
  parseGraphUsage,
  recordThrottle,
} from './rateLimit'

const GRAPH_API_VERSION = process.env.META_GRAPH_VERSION ?? 'v21.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`
const GRAPH_VERSION_PREFIX = /^\/v\d+\.\d+/
const LIST_FETCH_TIMEOUT_MS = 30_000
const UPLOAD_FETCH_TIMEOUT_MS = 120_000

interface GraphCall {
  readonly method: string
  readonly path: string
}

export function buildUrl(path: string, token: string, params: Record<string, string>): string {
  const qs = new URLSearchParams({ ...params, access_token: token })
  return `${GRAPH_API_BASE}${path}?${qs.toString()}`
}

export function callGraphApi<T>(url: string): Promise<T> {
  return sendGraphRequest<T>(url, { method: 'GET' }, LIST_FETCH_TIMEOUT_MS)
}

export function callGraphApiPost<T>(path: string, body: URLSearchParams): Promise<T> {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  }
  return sendGraphRequest<T>(`${GRAPH_API_BASE}${path}`, init, LIST_FETCH_TIMEOUT_MS)
}

export function callGraphApiMultipart<T>(path: string, form: FormData): Promise<T> {
  return sendGraphRequest<T>(`${GRAPH_API_BASE}${path}`, { method: 'POST', body: form }, UPLOAD_FETCH_TIMEOUT_MS)
}

async function sendGraphRequest<T>(url: string, init: RequestInit, timeoutMs: number): Promise<T> {
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

async function readGraphResponse<T>(response: Response, call: GraphCall): Promise<T> {
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
  return body as T
}

async function readJsonBody(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => '')
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

// Host, Graph version and query string stripped — the query string carries the token,
// so this is the only form of the URL that is safe to log.
function graphPath(url: string): string {
  return new URL(url).pathname.replace(GRAPH_VERSION_PREFIX, '')
}
