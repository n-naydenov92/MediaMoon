import { revalidateTag, unstable_cache } from 'next/cache'
import type { Market } from '@/types'

/**
 * Vercel Cache wrapper.
 *
 * Intent: when the DB arrives (Prisma + Postgres), this file becomes the
 * swap-point. The rest of the codebase keeps calling withCache() / invalidate()
 * unchanged.
 */

export const CACHE_TTL_SECONDS = 10_800 // 3 hours
const IMMEDIATE_EXPIRY = { expire: 0 }

export function buildCacheKey(tabId: string, market: Market): string {
  return `news_${tabId}_${market}`
}

export function withCache<T>(params: {
  readonly key: string
  readonly fetcher: () => Promise<T>
  readonly ttlSeconds?: number
  // Group tags, so one expireNow() call clears every key that carries them.
  readonly tags?: readonly string[]
}): Promise<T> {
  const cached = unstable_cache(params.fetcher, [params.key], {
    revalidate: params.ttlSeconds ?? CACHE_TTL_SECONDS,
    tags: [params.key, ...(params.tags ?? [])],
  })
  return cached()
}

export function invalidate(key: string): void {
  revalidateTag(key, 'default')
}

// Unlike invalidate(), the next read waits for fresh data instead of getting the old
// value once more while it refreshes in the background — what a manual reload expects.
export function expireNow(tag: string): void {
  revalidateTag(tag, IMMEDIATE_EXPIRY)
}
