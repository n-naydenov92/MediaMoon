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

export function buildCacheKey(tabId: string, market: Market): string {
  return `news_${tabId}_${market}`
}

export function withCache<T>(params: {
  readonly key: string
  readonly fetcher: () => Promise<T>
}): Promise<T> {
  const cached = unstable_cache(params.fetcher, [params.key], {
    revalidate: CACHE_TTL_SECONDS,
    tags: [params.key],
  })
  return cached()
}

export function invalidate(key: string): void {
  revalidateTag(key, 'default')
}
