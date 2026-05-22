const RETRY_BACKOFF_MS = [1000, 3000, 8000] as const

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
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return (await response.json()) as T
}

export async function postForm<T>(
  url: string,
  form: FormData,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { method: 'POST', body: form, signal })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return (await response.json()) as T
}

async function parseError(response: Response): Promise<string> {
  const fallback = `HTTP ${response.status}`
  try {
    const body = (await response.json()) as { error?: string }
    return body.error ?? fallback
  } catch {
    return fallback
  }
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown
  const delays: readonly (number | undefined)[] = [...RETRY_BACKOFF_MS, undefined]
  for (const delay of delays) {
    try {
      return await fn()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err
      }
      lastError = err
      if (delay !== undefined) {
        await sleep(delay)
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Retry exhausted')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
