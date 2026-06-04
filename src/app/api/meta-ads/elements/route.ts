import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getConfiguredBusinessManagersForBrand, getMetaTokenForAccount } from '@/config/metaTokens'
import {
  fetchElementsForAdIds,
  fetchRankedAdInsights,
  type AdAccount,
  type AdInsightsFilter,
  type AdWithCreativeElements,
  type RankedAdInsightsRow,
} from '@/lib/gateways/MetaAdsGateway'
import { parseDateRangeFromQuery, toMetaInsightsParams } from '@/lib/meta/dateRange'
import { convertFromEur, convertToEur } from '@/lib/meta/fx'
import { parseFilterRules, type ComparisonOperator } from '@/lib/meta/filterRules'
import { fetchAllAccounts } from '../summary/accountFetching'
import { parseBrandId, resolveTargetAccounts } from '../summary/queryParsing'

const DEFAULT_PAGE_SIZE = 200
const MAX_PAGE_SIZE = 500
const NO_TOKEN_STATUS = 503
const UPSTREAM_ERROR_STATUS = 502
const CACHE_MAX_AGE_SECONDS = 3600
const CACHE_STALE_WHILE_REVALIDATE_SECONDS = 600

// Only spend/impressions can be pushed into Meta's insights filtering (raw fields).
// ROAS/CPP/CTR/etc. are derived client-side and stay client-side view filters.
const SERVER_FILTER_FIELDS: ReadonlySet<string> = new Set(['spend', 'impressions'])

const OPERATOR_MAP: Record<ComparisonOperator, AdInsightsFilter['operator']> = {
  gt: 'GREATER_THAN',
  gte: 'GREATER_THAN_OR_EQUAL',
  lt: 'LESS_THAN',
  lte: 'LESS_THAN_OR_EQUAL',
  eq: 'EQUAL',
}

// Raw, additive metrics only — ratios (roas/ctr/cpp/cplpv) are derived client-side
// so they stay correct after elements are de-duplicated and aggregated across ads.
interface AdElementRow {
  readonly adId: string
  readonly name: string
  readonly creativeType: 'image' | 'video' | 'unknown'
  readonly thumbnailUrl: string | null
  readonly accountId: string
  readonly accountName: string
  readonly bodies: readonly string[]
  readonly titles: readonly string[]
  readonly urls: readonly string[]
  readonly imageHash: string | null
  readonly imageUrl: string | null
  readonly videoId: string | null
  readonly spend: number
  readonly revenue: number
  readonly impressions: number
  readonly purchases: number
  readonly linkClicks: number
  readonly lpv: number
}

interface ElementsResponse {
  readonly items: readonly AdElementRow[]
  readonly nextOffset: number | null
  readonly fetchedAt: number
}

interface AccountEntry {
  readonly account: AdAccount
  readonly token: string
  readonly row: RankedAdInsightsRow
  readonly spendEur: number
}

// One page of the brand's ads, ranked by spend across all its accounts. Meta sorts
// each account's insights by spend and we only fetch up to (offset+limit) rows, so
// we never paginate the whole account — that is what avoids Meta's app rate limit
// on large date windows. Metadata (the expensive creative expansion) is fetched
// only for the sliced page. Filtering/sorting of the derived elements is client-side.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams

  const brandId = parseBrandId(params.get('brandId'))
  if (!brandId) {
    return NextResponse.json(
      { error: 'brandId query param is required or unknown' },
      { status: 400 },
    )
  }

  const dateParams = toMetaInsightsParams(parseDateRangeFromQuery(params))
  const offset = clampInt(params.get('offset'), 0, 0, Number.MAX_SAFE_INTEGER)
  const limit = clampInt(params.get('limit'), DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE)
  const serverRules = parseFilterRules(params.get('filter')).filter(
    (r) => SERVER_FILTER_FIELDS.has(r.field) && typeof r.value === 'number',
  )

  const accountIds = resolveTargetAccounts(brandId, params.get('market'), params.get('account'))
  if (accountIds.length === 0) {
    return NextResponse.json(emptyResponse(), { headers: edgeCacheHeaders() })
  }

  if (getConfiguredBusinessManagersForBrand(brandId).length === 0) {
    return NextResponse.json(
      { error: `Meta token not configured for brand "${brandId}"` },
      { status: NO_TOKEN_STATUS },
    )
  }

  try {
    const accountsList = await fetchAllAccounts(brandId)
    const accountById = new Map(accountsList.map((a) => [a.id, a]))
    const targets = accountIds
      .map((id) => accountById.get(id))
      .filter((a): a is AdAccount => Boolean(a))

    const max = offset + limit

    const perAccount = await Promise.all(
      targets.map(async (account) => {
        const token = getMetaTokenForAccount(account.id)
        if (!token) {
          return null
        }
        const ranked = await fetchRankedAdInsights(token, account.id, dateParams, {
          filters: buildMetaFilters(serverRules, account.currency),
          max,
        })
        return { account, token, ranked }
      }),
    )
    const usable = perAccount.filter((x): x is NonNullable<typeof x> => x !== null)

    const merged: AccountEntry[] = usable.flatMap((u) =>
      u.ranked.map((row) => ({
        account: u.account,
        token: u.token,
        row,
        spendEur: convertToEur(row.insights.spend, u.account.currency),
      })),
    )
    merged.sort((a, b) => b.spendEur - a.spendEur)

    const pageEntries = merged.slice(offset, offset + limit)
    const items = await buildPageRows(pageEntries)

    const truncated = usable.some((u) => u.ranked.length >= max)
    const hasMore = merged.length > offset + limit || truncated
    const nextOffset = pageEntries.length === limit && hasMore ? offset + limit : null

    const response: ElementsResponse = { items, nextOffset, fetchedAt: Date.now() }
    return NextResponse.json(response, { headers: edgeCacheHeaders() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: UPSTREAM_ERROR_STATUS })
  }
}

// Fetch creative metadata per account (only for the page's ads), then re-order the
// resulting rows to match the global by-spend order of the page.
async function buildPageRows(pageEntries: readonly AccountEntry[]): Promise<readonly AdElementRow[]> {
  const byAccount = new Map<string, { account: AdAccount; token: string; rows: RankedAdInsightsRow[] }>()
  for (const entry of pageEntries) {
    const group = byAccount.get(entry.account.id)
      ?? { account: entry.account, token: entry.token, rows: [] }
    group.rows.push(entry.row)
    byAccount.set(entry.account.id, group)
  }

  const elementByAdId = new Map<string, { ad: AdWithCreativeElements; accountName: string }>()
  await Promise.all(
    [...byAccount.values()].map(async (group) => {
      const ads = await fetchElementsForAdIds(group.token, group.account.id, group.account.currency, group.rows)
      for (const ad of ads) {
        elementByAdId.set(ad.id, { ad, accountName: group.account.name })
      }
    }),
  )

  return pageEntries
    .map((entry) => {
      const hit = elementByAdId.get(entry.row.adId)
      return hit ? toElementRow(hit.ad, hit.accountName) : null
    })
    .filter((row): row is AdElementRow => row !== null)
}

// User-typed thresholds are always in EUR (the UI shows EUR everywhere). Meta's
// `filtering` compares in the account's native currency, so the spend threshold is
// converted back per account. impressions is a raw count — no conversion. Base
// spend>0 is always kept so zero-spend ads stay excluded.
function buildMetaFilters(
  serverRules: ReturnType<typeof parseFilterRules>,
  currency: string,
): readonly AdInsightsFilter[] {
  const filters: AdInsightsFilter[] = [{ field: 'spend', operator: 'GREATER_THAN', value: 0 }]
  for (const rule of serverRules) {
    if (typeof rule.value !== 'number') {
      continue
    }
    const value = rule.field === 'spend'
      ? Math.round(convertFromEur(rule.value, currency))
      : Math.round(rule.value)
    filters.push({ field: rule.field, operator: OPERATOR_MAP[rule.operator], value })
  }
  return filters
}

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const n = raw === null ? fallback : Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) {
    return fallback
  }
  return Math.min(Math.max(n, min), max)
}

function emptyResponse(): ElementsResponse {
  return { items: [], nextOffset: null, fetchedAt: Date.now() }
}

function edgeCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': `s-maxage=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE_SECONDS}`,
  }
}

function toElementRow(ad: AdWithCreativeElements, accountName: string): AdElementRow {
  const { purchases, impressions, linkClicks } = ad.insights
  return {
    adId: ad.id,
    name: ad.name,
    creativeType: ad.creativeType,
    thumbnailUrl: ad.thumbnailUrl,
    accountId: ad.accountId,
    accountName,
    bodies: ad.elements.bodies,
    titles: ad.elements.titles,
    urls: ad.elements.urls,
    imageHash: ad.elements.imageHash,
    imageUrl: ad.elements.imageUrl,
    videoId: ad.elements.videoId,
    spend: convertToEur(ad.insights.spend, ad.currency),
    revenue: convertToEur(ad.insights.revenue, ad.currency),
    impressions,
    purchases,
    linkClicks,
    lpv: ad.insights.landingPageViews,
  }
}
