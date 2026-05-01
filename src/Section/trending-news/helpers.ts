import type { AsyncState, NewsResult, RssArticle } from '@/types'
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
