// Cached data belongs to the person who loaded it: it lives in their browser session only
// (survives in-app navigation, gone on reload) and is never shared with another tab,
// device or user. Anyone else opening the app makes their own request.

export interface SessionCache<T> {
  readonly get: (key: string) => T | undefined
  readonly set: (key: string, value: T) => void
}

interface Clearable {
  readonly clear: () => void
}

const caches = new Set<Clearable>()

export function createSessionCache<T>(): SessionCache<T> {
  const entries = new Map<string, T>()
  caches.add(entries)
  return {
    get: (key) => entries.get(key),
    set: (key, value) => {
      // Module state on the server is shared by every request, so nothing is ever stored there.
      if (typeof window === 'undefined') {
        return
      }
      entries.set(key, value)
    },
  }
}

// Refresh on any screen means "fresh data everywhere", so it empties every session cache.
export function clearSessionCaches(): void {
  caches.forEach((cache) => cache.clear())
}
