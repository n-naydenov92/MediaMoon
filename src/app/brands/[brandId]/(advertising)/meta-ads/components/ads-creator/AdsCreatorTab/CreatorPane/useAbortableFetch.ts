'use client'

import { useEffect, useState } from 'react'

/** GET a JSON endpoint, exposing the latest body as state.
 *  Pass `url: null` when the request is not yet eligible (missing dependency)
 *  and the hook will clear data without firing. Aborts on unmount and on URL
 *  change. Non-abort errors are logged but never thrown. */
export function useAbortableFetch<T>(url: string | null): T | null {
  const [data, setData] = useState<T | null>(null)

  useEffect(() => {
    if (!url) {
      setData(null)
      return undefined
    }
    const ctrl = new AbortController()
    void (async () => {
      try {
        const res = await fetch(url, { signal: ctrl.signal })
        if (!res.ok || ctrl.signal.aborted) return
        const json = (await res.json()) as T
        if (!ctrl.signal.aborted) {
          setData(json)
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        // eslint-disable-next-line no-console -- intentional logging at fetch boundary
        console.error('[useAbortableFetch]', url, err)
      }
    })()
    return () => ctrl.abort()
  }, [url])

  return data
}
