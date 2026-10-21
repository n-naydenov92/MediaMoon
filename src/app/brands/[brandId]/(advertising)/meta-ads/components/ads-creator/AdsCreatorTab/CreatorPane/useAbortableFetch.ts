'use client'

import { useEffect, useState } from 'react'

interface LoadedResponse<T> {
  readonly url: string
  readonly body: T
}

/** GET a JSON endpoint, exposing the latest body as state.
 *  Pass `url: null` when the request is not yet eligible (missing dependency)
 *  and the hook returns null without firing. Aborts on unmount and on URL
 *  change. Non-abort errors are logged but never thrown.
 *  A body is returned only for the URL it was fetched for — otherwise, while the
 *  next request is in flight (or after it failed), callers would see the previous
 *  URL's data, e.g. campaign A's ad sets listed under campaign B. */
export function useAbortableFetch<T>(url: string | null): T | null {
  const [loaded, setLoaded] = useState<LoadedResponse<T> | null>(null)

  useEffect(() => {
    if (!url) {
      return undefined
    }
    const ctrl = new AbortController()
    void (async () => {
      try {
        const res = await fetch(url, { signal: ctrl.signal })
        if (!res.ok || ctrl.signal.aborted) {
          return
        }
        const body = (await res.json()) as T
        if (!ctrl.signal.aborted) {
          setLoaded({ url, body })
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        // eslint-disable-next-line no-console -- intentional logging at fetch boundary
        console.error('[useAbortableFetch]', url, err)
      }
    })()
    return () => ctrl.abort()
  }, [url])

  return loaded !== null && loaded.url === url ? loaded.body : null
}
