import { XMLParser } from 'fast-xml-parser'
import type { LanguageConfig, Market, RssArticle } from '@/types'

/**
 * RssGateway — the only place in the codebase that knows about Google News RSS.
 * Swap this out when the upstream changes; nothing else needs to move.
 */

const GOOGLE_NEWS_RSS_BASE = 'https://news.google.com/rss/search'
const WINDOW_HOURS = 24
const MS_PER_HOUR = 60 * 60 * 1000

interface RssFeedItem {
  title?: string
  link?: string
  source?: string | { '#text'?: string }
  pubDate?: string
}

interface ParsedFeed {
  rss?: {
    channel?: {
      item?: RssFeedItem | RssFeedItem[]
    }
  }
}

export interface RssFetchParams {
  readonly query: string
  readonly market: Market
  readonly language: LanguageConfig
}

export async function fetchAndParse(params: RssFetchParams): Promise<readonly RssArticle[]> {
  if (!params.query.trim()) {
    return []
  }
  const url = buildUrl(params)
  const xml = await fetchXml(url)
  const items = extractItems(xml)
  const articles = items.map((item) => toArticle(item, params.market)).filter(isFresh)
  return articles
}

// ─── Helpers (each does one thing, single level of abstraction) ──────────────

function buildUrl({ query, language }: RssFetchParams): string {
  const params = new URLSearchParams({
    q: query,
    hl: language.hl,
    gl: language.gl,
    ceid: language.ceid,
  })
  return `${GOOGLE_NEWS_RSS_BASE}?${params.toString()}`
}

const FETCH_TIMEOUT_MS = 5_000

async function fetchXml(url: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0' },
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`)
    }
    return await response.text()
  } finally {
    clearTimeout(timer)
  }
}

function extractItems(xml: string): readonly RssFeedItem[] {
  const parser = new XMLParser({ ignoreAttributes: false })
  const parsed = parser.parse(xml) as ParsedFeed
  const raw = parsed.rss?.channel?.item
  if (!raw) {
    return []
  }
  return Array.isArray(raw) ? raw : [raw]
}

function toArticle(item: RssFeedItem, market: Market): RssArticle {
  return {
    title: (item.title ?? '').trim(),
    url: (item.link ?? '').trim(),
    source: extractSource(item.source),
    pubDate: normaliseDate(item.pubDate),
    market,
  }
}

function extractSource(source: RssFeedItem['source']): string {
  if (!source) {
    return 'Unknown'
  }
  if (typeof source === 'string') {
    return source
  }
  return source['#text'] ?? 'Unknown'
}

function normaliseDate(raw: string | undefined): string {
  if (!raw) {
    return new Date().toISOString()
  }
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString()
  }
  return parsed.toISOString()
}

function isFresh(article: RssArticle): boolean {
  if (!article.title || !article.url) {
    return false
  }
  const ageMs = Date.now() - new Date(article.pubDate).getTime()
  return ageMs >= 0 && ageMs <= WINDOW_HOURS * MS_PER_HOUR
}
