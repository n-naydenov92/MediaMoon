import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getConfiguredBusinessManagersForBrand, getMetaTokenForAccount } from '@/config/metaTokens'
import {
  fetchAdsWithInsights,
  type AdAccount,
  type AdInsightsFilter,
  type AdWithInsights,
} from '@/lib/gateways/MetaAdsGateway'
import { parseDateRangeFromQuery, toMetaInsightsParams } from '@/lib/meta/dateRange'
import { convertToEur } from '@/lib/meta/fx'
import { fetchAllAccounts } from '../summary/accountFetching'
import { parseBrandId, resolveTargetAccounts } from '../summary/queryParsing'

const ADS_PER_ACCOUNT_LIMIT = 200
const NO_TOKEN_STATUS = 503
const UPSTREAM_ERROR_STATUS = 502
const DEFAULT_PAGE_LIMIT = 50
const MAX_PAGE_LIMIT = 200
const CACHE_MAX_AGE_SECONDS = 3600
const CACHE_STALE_WHILE_REVALIDATE_SECONDS = 600

interface AdRow {
  readonly adId: string
  readonly name: string
  readonly status: string
  readonly creativeType: 'image' | 'video' | 'unknown'
  readonly thumbnailUrl: string | null
  readonly accountId: string
  readonly accountName: string
  readonly spend: number
  readonly revenue: number
  readonly roas: number
  readonly purchases: number
  readonly cpp: number
  readonly ctr: number
  readonly cpm: number
  readonly cpc: number
  readonly impressions: number
  readonly clicks: number
  readonly lpv: number
  readonly cplpv: number
  readonly atc: number
  readonly cpatc: number
  readonly ic: number
  readonly cpic: number
}

interface AdsListResponse {
  readonly items: readonly AdRow[]
  readonly total: number
  readonly nextOffset: number | null
  readonly fetchedAt: number
}

type FilterRule =
  | { readonly field: string; readonly operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'; readonly value: number }
  | { readonly field: 'status' | 'creativeType'; readonly operator: 'eq'; readonly value: string }

const NUMERIC_FIELDS: ReadonlySet<string> = new Set([
  'spend',
  'revenue',
  'roas',
  'purchases',
  'cpp',
  'ctr',
  'cpm',
  'cpc',
  'lpv',
  'cplpv',
  'atc',
  'cpatc',
  'ic',
  'cpic',
  'impressions',
  'clicks',
])

const META_NATIVE_FIELDS: ReadonlySet<string> = new Set(['spend', 'impressions'])

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams

  const brandId = parseBrandId(params.get('brandId'))
  if (!brandId) {
    return NextResponse.json(
      { error: 'brandId query param is required or unknown' },
      { status: 400 },
    )
  }

  const dateSelection = parseDateRangeFromQuery(params)
  const dateParams = toMetaInsightsParams(dateSelection)
  const rules = parseFilterRules(params.get('filter'))
  const sort = parseSort(params.get('sort'))
  const offset = parseOffset(params.get('offset'))
  const limit = parseLimit(params.get('limit'))

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

    const metaFilters = buildMetaSideFilters(rules)

    const perAccount = await Promise.all(
      targets.map(async (account) => {
        const token = getMetaTokenForAccount(account.id)
        if (!token) {
          return null
        }
        const ads = await fetchAdsWithInsights(token, account.id, account.currency, dateParams, {
          limit: ADS_PER_ACCOUNT_LIMIT,
          filters: metaFilters,
        })
        return { account, ads: ads.slice(0, ADS_PER_ACCOUNT_LIMIT) }
      }),
    )
    const usable = perAccount.filter((x): x is NonNullable<typeof x> => x !== null)

    const allRows: AdRow[] = usable.flatMap((u) =>
      u.ads.map((ad) => toAdRow(ad, u.account.name)),
    )

    const filtered = allRows.filter((row) => rules.every((rule) => matchesRule(row, rule)))
    const sorted = sortRows(filtered, sort)
    const sliced = sorted.slice(offset, offset + limit)
    const nextOffset = offset + limit < sorted.length ? offset + limit : null

    const response: AdsListResponse = {
      items: sliced,
      total: sorted.length,
      nextOffset,
      fetchedAt: Date.now(),
    }
    return NextResponse.json(response, { headers: edgeCacheHeaders() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: UPSTREAM_ERROR_STATUS })
  }
}

function emptyResponse(): AdsListResponse {
  return { items: [], total: 0, nextOffset: null, fetchedAt: Date.now() }
}

function edgeCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': `s-maxage=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE_SECONDS}`,
  }
}

function buildMetaSideFilters(rules: readonly FilterRule[]): readonly AdInsightsFilter[] {
  const metaFilters: AdInsightsFilter[] = []
  let hasSpendFilter = false
  for (const rule of rules) {
    if (!META_NATIVE_FIELDS.has(rule.field)) {
      continue
    }
    if (typeof rule.value !== 'number') {
      continue
    }
    if (rule.operator === 'gt' || rule.operator === 'gte') {
      metaFilters.push({ field: rule.field, operator: 'GREATER_THAN', value: rule.value })
      if (rule.field === 'spend') {
        hasSpendFilter = true
      }
    } else if (rule.operator === 'lt' || rule.operator === 'lte') {
      metaFilters.push({ field: rule.field, operator: 'LESS_THAN', value: rule.value })
    }
  }
  if (!hasSpendFilter) {
    metaFilters.push({ field: 'spend', operator: 'GREATER_THAN', value: 0 })
  }
  return metaFilters
}

function toAdRow(ad: AdWithInsights, accountName: string): AdRow {
  const spend = convertToEur(ad.insights.spend, ad.currency)
  const revenue = convertToEur(ad.insights.revenue, ad.currency)
  const purchases = ad.insights.purchases
  const impressions = ad.insights.impressions
  const clicks = ad.insights.clicks
  const linkClicks = ad.insights.linkClicks
  const lpv = ad.insights.landingPageViews
  const atc = ad.insights.addsToCart
  const ic = ad.insights.checkoutsInitiated
  return {
    adId: ad.id,
    name: ad.name,
    status: ad.effectiveStatus,
    creativeType: ad.creativeType,
    thumbnailUrl: ad.thumbnailUrl,
    accountId: ad.accountId,
    accountName,
    spend,
    revenue,
    roas: spend > 0 ? revenue / spend : 0,
    purchases,
    cpp: purchases > 0 ? spend / purchases : 0,
    impressions,
    clicks,
    ctr: impressions > 0 ? linkClicks / impressions : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    cpc: linkClicks > 0 ? spend / linkClicks : 0,
    lpv,
    cplpv: lpv > 0 ? spend / lpv : 0,
    atc,
    cpatc: atc > 0 ? spend / atc : 0,
    ic,
    cpic: ic > 0 ? spend / ic : 0,
  }
}

function matchesRule(row: AdRow, rule: FilterRule): boolean {
  if (rule.field === 'status') {
    return row.status === rule.value
  }
  if (rule.field === 'creativeType') {
    return row.creativeType === rule.value
  }
  if (!NUMERIC_FIELDS.has(rule.field)) {
    return true
  }
  const value = (row as unknown as Record<string, number>)[rule.field]
  if (typeof value !== 'number' || typeof rule.value !== 'number') {
    return true
  }
  switch (rule.operator) {
    case 'gt':
      return value > rule.value
    case 'gte':
      return value >= rule.value
    case 'lt':
      return value < rule.value
    case 'lte':
      return value <= rule.value
    case 'eq':
      return value === rule.value
  }
}

function sortRows(rows: readonly AdRow[], sort: { field: string; direction: 'asc' | 'desc' }): AdRow[] {
  const field = NUMERIC_FIELDS.has(sort.field) ? sort.field : 'spend'
  const sign = sort.direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = (a as unknown as Record<string, number>)[field] ?? 0
    const bv = (b as unknown as Record<string, number>)[field] ?? 0
    return (av - bv) * sign
  })
}

function parseFilterRules(raw: string | null): readonly FilterRule[] {
  if (!raw) {
    return []
  }
  const rules: FilterRule[] = []
  for (const part of raw.split(';')) {
    const segments = part.split(':')
    if (segments.length !== 3) {
      continue
    }
    const [field, op, value] = segments
    if (!field || !op || value === undefined) {
      continue
    }
    if (op !== 'gt' && op !== 'gte' && op !== 'lt' && op !== 'lte' && op !== 'eq') {
      continue
    }
    if (field === 'status' || field === 'creativeType') {
      if (op !== 'eq') {
        continue
      }
      rules.push({ field, operator: 'eq', value })
      continue
    }
    if (!NUMERIC_FIELDS.has(field)) {
      continue
    }
    const n = Number(value)
    if (!Number.isFinite(n)) {
      continue
    }
    rules.push({ field, operator: op, value: n })
  }
  return rules
}

function parseSort(raw: string | null): { field: string; direction: 'asc' | 'desc' } {
  if (!raw) {
    return { field: 'spend', direction: 'desc' }
  }
  const [field, direction] = raw.split(':')
  if (!field || (direction !== 'asc' && direction !== 'desc')) {
    return { field: 'spend', direction: 'desc' }
  }
  return { field, direction }
}

function parseOffset(raw: string | null): number {
  if (!raw) {
    return 0
  }
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
}

function parseLimit(raw: string | null): number {
  if (!raw) {
    return DEFAULT_PAGE_LIMIT
  }
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) {
    return DEFAULT_PAGE_LIMIT
  }
  return Math.min(Math.floor(n), MAX_PAGE_LIMIT)
}
