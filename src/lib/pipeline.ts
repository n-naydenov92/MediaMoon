import type {
  HeatLevel,
  Market,
  NewsCluster,
  NewsResult,
  NewsStats,
  RssArticle,
  SourceCounts,
  SourceErrors,
} from '@/types'
import { fetchAndParse } from '@/lib/gateways/RssGateway'
import { fetchFromSearchApi } from '@/lib/gateways/SearchApiGateway'
import { cluster, type RawCluster } from '@/lib/gateways/ClusteringGateway'
import { getScore } from '@/lib/gateways/TrendsGateway'
import { CACHE_TTL_SECONDS, buildCacheKey, withCache } from '@/lib/cache'
import { isTopicTab, type TabConfig, type TopicTabConfig } from '@/Section/trending-news/config'

/**
 * Pipeline orchestrator.
 *
 * Knows nothing about HTTP, RSS internals, Claude message shapes, or the
 * google-trends package. Talks only to gateways.
 */

const SEARCH_API_HL: Record<Market, string> = { BG: 'bg', ES: 'es', WORLD: 'en' }
const SEARCH_API_GL: Record<Market, string> = { BG: 'bg', ES: 'es', WORLD: 'us' }

const COVERAGE_WEIGHT = 0.6
const TRENDS_WEIGHT = 0.4
const HEAT_VIRAL_THRESHOLD = 5
const HEAT_HOT_THRESHOLD = 3
const MS_PER_SECOND = 1000

// ─── Public API ─────────────────────────────────────────────────────────────

export async function getNewsForTabMarket(params: {
  readonly tab: TabConfig
  readonly market: Market
}): Promise<NewsResult> {
  if (!isTopicTab(params.tab)) {
    throw new Error(`Only topic tabs can be pipeline-fetched: ${params.tab.id}`)
  }
  const key = buildCacheKey(params.tab.id, params.market)
  return withCache({
    key,
    fetcher: () => runPipeline(params.tab as TopicTabConfig, params.market),
  })
}

// ─── Pipeline steps ─────────────────────────────────────────────────────────

async function runPipeline(tab: TopicTabConfig, market: Market): Promise<NewsResult> {
  const { articles, sourceCounts, sourceErrors } = await fetchArticles(tab, market)
  const unique = deduplicateByUrl(articles)
  const rawClusters = await safeCluster(unique)
  const enriched = await enrichWithTrends(rawClusters, market, tab.id)
  const sorted = sortByDate(enriched)
  return assembleResult(tab.id, market, sorted, sourceCounts, sourceErrors)
}

async function fetchArticles(
  tab: TopicTabConfig,
  market: Market,
): Promise<{ articles: readonly RssArticle[]; sourceCounts: SourceCounts; sourceErrors: SourceErrors }> {
  const [googleNews, searchApi] = await Promise.allSettled([
    fetchFromGoogleNews(tab, market),
    fetchFromSearchApiSource(tab, market),
  ])

  const resolve = (r: PromiseSettledResult<readonly RssArticle[]>) =>
    r.status === 'fulfilled' ? r.value : []
  const err = (r: PromiseSettledResult<readonly RssArticle[]>) =>
    r.status === 'rejected' ? String(r.reason) : undefined

  return {
    articles: [
      ...resolve(googleNews),
      ...resolve(searchApi),
    ],
    sourceCounts: {
      googleNewsRss: resolve(googleNews).length,
      searchApi: resolve(searchApi).length,
    },
    sourceErrors: {
      googleNewsRss: err(googleNews),
      searchApi: err(searchApi),
    },
  }
}

async function fetchFromGoogleNews(
  tab: TopicTabConfig,
  market: Market,
): Promise<readonly RssArticle[]> {
  const query = tab.queries[market]
  const language = tab.language[market]
  if (!query) {
    return []
  }
  return fetchAndParse({ query, market, language })
}

async function fetchFromSearchApiSource(
  tab: TopicTabConfig,
  market: Market,
): Promise<readonly RssArticle[]> {
  const query = tab.searchApiQuery?.[market]
  if (!query) {
    return []
  }
  return fetchFromSearchApi({
    query,
    market,
    hl: SEARCH_API_HL[market],
    gl: SEARCH_API_GL[market],
  })
}

function normaliseTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim()
}

function deduplicateByUrl(articles: readonly RssArticle[]): readonly RssArticle[] {
  const seenUrls = new Set<string>()
  const seenTitles = new Set<string>()
  const out: RssArticle[] = []
  for (const article of articles) {
    const normTitle = normaliseTitle(article.title)
    if (seenUrls.has(article.url) || seenTitles.has(normTitle)) continue
    seenUrls.add(article.url)
    seenTitles.add(normTitle)
    out.push(article)
  }
  return out
}

async function safeCluster(articles: readonly RssArticle[]): Promise<readonly RawCluster[]> {
  if (articles.length === 0) {
    return []
  }
  try {
    return await cluster(articles)
  } catch {
    // Graceful degrade: one article per cluster
    return articles.map((a) => ({ representativeTitle: a.title, articles: [a] }))
  }
}

async function enrichWithTrends(
  clusters: readonly RawCluster[],
  market: Market,
  tabId: string,
): Promise<readonly NewsCluster[]> {
  const scores = await Promise.all(
    clusters.map((c) => getScore(c.representativeTitle)),
  )
  return clusters.map((c, i) => {
    const trendsScore = scores[i] ?? null
    const coverage = c.articles.length
    return {
      representativeTitle: c.representativeTitle,
      articles: c.articles,
      coverage,
      trendsScore,
      heat: classifyHeat(coverage),
      score: computeScore(coverage, trendsScore),
      market,
      tabId,
    }
  })
}

function classifyHeat(coverage: number): HeatLevel {
  if (coverage >= HEAT_VIRAL_THRESHOLD) {
    return 'viral'
  }
  if (coverage >= HEAT_HOT_THRESHOLD) {
    return 'hot'
  }
  return 'normal'
}

function computeScore(coverage: number, trendsScore: number | null): number {
  const normalisedTrends = trendsScore === null ? 0 : trendsScore / 100
  return coverage * COVERAGE_WEIGHT + normalisedTrends * TRENDS_WEIGHT
}

function sortByDate(clusters: readonly NewsCluster[]): readonly NewsCluster[] {
  return [...clusters].sort((a, b) => {
    const latestA = Math.max(...a.articles.map((art) => new Date(art.pubDate).getTime()))
    const latestB = Math.max(...b.articles.map((art) => new Date(art.pubDate).getTime()))
    return latestB - latestA
  })
}

function assembleResult(
  tabId: string,
  market: Market,
  clusters: readonly NewsCluster[],
  sourceCounts: SourceCounts,
  sourceErrors: SourceErrors,
): NewsResult {
  const now = Date.now()
  return {
    fetchedAt: new Date(now).toISOString(),
    cacheExpiresAt: new Date(now + CACHE_TTL_SECONDS * MS_PER_SECOND).toISOString(),
    tabId,
    market,
    clusters,
    stats: computeStats(clusters),
    sourceCounts,
    sourceErrors,
  }
}

function computeStats(clusters: readonly NewsCluster[]): NewsStats {
  const totalArticles = clusters.reduce((sum, c) => sum + c.coverage, 0)
  const viralCount = clusters.filter((c) => c.heat === 'viral').length
  const hotCount = clusters.filter((c) => c.heat === 'hot').length
  return {
    totalArticles,
    totalClusters: clusters.length,
    viralCount,
    hotCount,
  }
}
