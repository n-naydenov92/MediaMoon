import type { Market, RssArticle } from '@/types'

/**
 * SearchApiGateway — queries searchapi.io with engine=google_news.
 * Unlike Google News RSS (firehose), this searches by keyword across the full
 * Google News index, returning articles from the last 24 h regardless of site publish volume.
 * https://www.searchapi.io/docs/google-news
 */

const BASE_URL = 'https://www.searchapi.io/api/v1/search'

interface SearchApiNewsResult {
  readonly title?: string
  readonly link?: string
  readonly source?: { readonly name?: string } | string
  readonly date?: string
  readonly iso_date?: string
}

interface SearchApiOrganicResult {
  readonly title?: string
  readonly link?: string
  readonly source?: string
  readonly date?: string
  readonly iso_date?: string
}

interface SearchApiResponse {
  readonly news_results?: readonly SearchApiNewsResult[]
  readonly top_stories?: readonly SearchApiNewsResult[]
  readonly organic_results?: readonly SearchApiOrganicResult[]
  readonly error?: string
}

export interface SearchApiParams {
  readonly query: string
  readonly market: Market
  readonly hl: string
  readonly gl: string
}

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

function parseDateSafe(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString()
  const d = new Date(dateStr)
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

function isWithin30Days(pubDate: string): boolean {
  const ageMs = Date.now() - new Date(pubDate).getTime()
  return ageMs >= 0 && ageMs <= MAX_AGE_MS
}

export async function fetchFromSearchApi(
  params: SearchApiParams,
): Promise<readonly RssArticle[]> {
  const apiKey = process.env.SEARCH_API_KEY
  if (!apiKey) return []

  const searchParams = new URLSearchParams({
    engine: 'google_news',
    q: params.query,
    hl: params.hl,
    gl: params.gl,
    tbs: 'qdr:m',
    api_key: apiKey,
  })

  const response = await fetch(`${BASE_URL}?${searchParams.toString()}`, {
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    throw new Error(`SearchAPI HTTP ${response.status}`)
  }

  const data = (await response.json()) as SearchApiResponse

  if (process.env.NODE_ENV === 'development') {
    /* eslint-disable no-console -- dev-only debug logging */
    console.log('[SearchAPI] response keys:', Object.keys(data))
    console.log('[SearchAPI] news_results length:', data.news_results?.length ?? 'undefined')
    console.log('[SearchAPI] top_stories length:', data.top_stories?.length ?? 'undefined')
    console.log('[SearchAPI] organic_results length:', data.organic_results?.length ?? 'undefined')
    data.organic_results?.forEach((r, i) => console.log(`[SearchAPI] organic[${i}] iso_date=${r.iso_date ?? 'MISSING'} date=${r.date} title=${r.title?.slice(0, 40)}`))
    /* eslint-enable no-console */
  }

  if (data.error) {
    throw new Error(`SearchAPI error: ${data.error}`)
  }

  const newsItems = data.news_results ?? data.top_stories ?? []
  const organicItems = data.organic_results ?? []

  const fromNews = newsItems
    .filter((item) => item.title && item.link)
    .map((item) => ({
      title: (item.title as string).trim(),
      url: (item.link as string).trim(),
      source: typeof item.source === 'string' ? item.source : (item.source?.name ?? 'Unknown'),
      pubDate: parseDateSafe(item.iso_date ?? item.date),
      market: params.market,
    }))

  const fromOrganic = organicItems
    .filter((item) => item.title && item.link)
    .map((item) => ({
      title: (item.title as string).trim(),
      url: (item.link as string).trim(),
      source: item.source ?? 'Unknown',
      pubDate: parseDateSafe(item.iso_date ?? item.date),
      market: params.market,
    }))

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console -- dev-only debug logging
    console.log(`[SearchAPI] returning: ${fromNews.length} from news/top_stories, ${fromOrganic.length} from organic`)
  }

  return [...fromNews, ...fromOrganic].filter((a) => isWithin30Days(a.pubDate))
}
