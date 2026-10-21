const RETRY_BACKOFF_MS = [1000, 3000, 8000] as const
// The Meta routes answer 504 when Meta was briefly unavailable or did not answer in time.
const RETRY_NOW_STATUS = 504

export class HttpError extends Error {
  readonly status: number

  readonly body: Readonly<Record<string, unknown>>

  constructor(status: number, body: Readonly<Record<string, unknown>>) {
    super(typeof body.error === 'string' ? body.error : `HTTP ${status}`)
    this.name = 'HttpError'
    this.status = status
    this.body = body
  }
}

export async function postJson<T>(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  return readResponse<T>(response)
}

export async function postForm<T>(
  url: string,
  form: FormData,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { method: 'POST', body: form, signal })
  return readResponse<T>(response)
}

// Retries only failures that are safe to repeat and likely to pass next time: network
// drops and Meta being briefly unavailable (504). A throttle (429) is never retried —
// calling Meta during a block only extends it — so the job fails at once with Meta's
// wait time in the message.
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (const delay of RETRY_BACKOFF_MS) {
    try {
      return await fn()
    } catch (err) {
      if (!isRetryable(err)) {
        throw err
      }
      await sleep(delay)
    }
  }
  return fn()
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new HttpError(response.status, await readErrorBody(response))
  }
  return (await response.json()) as T
}

async function readErrorBody(response: Response): Promise<Readonly<Record<string, unknown>>> {
  try {
    const body: unknown = await response.json()
    return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function isRetryable(err: unknown): boolean {
  if (err instanceof HttpError) {
    return err.status === RETRY_NOW_STATUS
  }
  // fetch rejects with a TypeError when the network drops; an abort must propagate.
  return err instanceof TypeError
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
