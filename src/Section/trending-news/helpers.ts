import type { AsyncState, Market, NewsResult, NewsStats, RssArticle, SourceErrors } from '@/types'
import { cacheKey } from './context/trendingNewsCtx'
import { LABELS } from './labels'

const SUMMARY_SOURCE_LIMIT = 3

export function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)
  if (diffMinutes < 1) {
    return LABELS.relativeTime.justNow
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}${LABELS.relativeTime.mAgo}`
  }
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}${LABELS.relativeTime.hAgo}`
  }
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}${LABELS.relativeTime.dAgo}`
}

export function pickTopSources(articles: readonly RssArticle[]): string {
  const seen = new Set<string>()
  const ordered: string[] = []
  for (const a of articles) {
    if (!seen.has(a.source)) {
      seen.add(a.source)
      ordered.push(a.source)
    }
  }
  const head = ordered.slice(0, SUMMARY_SOURCE_LIMIT)
  const overflow = ordered.length - head.length
  return overflow > 0 ? `${head.join(', ')} +${overflow}` : head.join(', ')
}

export function pickLatestPubDate(articles: readonly RssArticle[]): string | null {
  if (articles.length === 0) {
    return null
  }
  return articles
    .map((a) => a.pubDate)
    .reduce((latest, current) => (current > latest ? current : latest))
}

export function parseQuery(query: string): readonly string[] {
  if (!query.trim()) {
    return []
  }
  return query
    .split(' OR ')
    .map((part) => part.trim().replace(/^"(.*)"$/, '$1').trim())
    .filter((part) => part.length > 0)
}

export function pickLatestExpiry(
  states: ReadonlyMap<string, AsyncState<NewsResult>>,
): string | null {
  let latest: string | null = null
  for (const state of states.values()) {
    if (state.status !== 'success') {
      continue
    }
    if (!latest || state.data.cacheExpiresAt > latest) {
      latest = state.data.cacheExpiresAt
    }
  }
  return latest
}

export function pickActiveExpiry(
  states: ReadonlyMap<string, AsyncState<NewsResult>>,
  brandId: string,
  market: Market,
): string | null {
  const state = states.get(cacheKey(brandId, market))
  return state?.status === 'success' ? state.data.cacheExpiresAt : null
}

export function pickLatestFetchedAt(
  states: ReadonlyMap<string, AsyncState<NewsResult>>,
): number | null {
  let latest: number | null = null
  for (const state of states.values()) {
    if (state.status !== 'success') {
      continue
    }
    const ts = Date.parse(state.data.fetchedAt)
    if (latest === null || ts > latest) {
      latest = ts
    }
  }
  return latest
}

export function pickActiveFetchedAt(
  states: ReadonlyMap<string, AsyncState<NewsResult>>,
  brandId: string,
  market: Market,
): number | null {
  const state = states.get(cacheKey(brandId, market))
  return state?.status === 'success' ? Date.parse(state.data.fetchedAt) : null
}

export function isAnyLoading(states: ReadonlyMap<string, AsyncState<NewsResult>>): boolean {
  for (const state of states.values()) {
    if (state.status === 'loading') {
      return true
    }
  }
  return false
}

export function hasAnyError(errors: SourceErrors): boolean {
  return Object.values(errors).some((e) => Boolean(e))
}

export function mergeStats(all: readonly NewsStats[]): NewsStats {
  return all.reduce<NewsStats>(
    (acc, s) => ({
      totalArticles: acc.totalArticles + s.totalArticles,
      totalClusters: acc.totalClusters + s.totalClusters,
      viralCount: acc.viralCount + s.viralCount,
      hotCount: acc.hotCount + s.hotCount,
    }),
    { totalArticles: 0, totalClusters: 0, viralCount: 0, hotCount: 0 },
  )
}
