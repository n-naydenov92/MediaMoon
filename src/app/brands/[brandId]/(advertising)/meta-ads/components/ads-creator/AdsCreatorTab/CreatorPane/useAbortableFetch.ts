'use client'

import { useEffect, useState } from 'react'

interface Snapshot<T> {
  readonly url: string
  readonly data: T
}

/** GET a JSON endpoint, exposing the latest body as state.
 *  Pass `url: null` when the request is not yet eligible (missing dependency)
 *  and the hook returns null without firing. Aborts on unmount and on URL
 *  change. Non-abort errors are logged but never thrown. */
export function useAbortableFetch<T>(url: string | null): T | null {
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null)

  useEffect(() => {
    if (!url) {
      return undefined
    }
    const ctrl = new AbortController()
    void (async () => {
      try {
        const res = await fetch(url, { signal: ctrl.signal })
        if (!res.ok || ctrl.signal.aborted) return
        const json = (await res.json()) as T
        if (!ctrl.signal.aborted) {
          setSnapshot({ url, data: json })
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        // eslint-disable-next-line no-console -- intentional logging at fetch boundary
        console.error('[useAbortableFetch]', url, err)
      }
    })()
    return () => ctrl.abort()
  }, [url])

  // Only ever expose a body for the URL it was fetched from. Otherwise, between a URL
  // change and its response, the previous body keeps rendering — e.g. the old
  // campaign's ad sets stay pickable after switching campaign, and ads publish into
  // an ad set of the wrong campaign.
  return snapshot !== null && snapshot.url === url ? snapshot.data : null
}
