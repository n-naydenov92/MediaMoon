import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isBrandId, type BrandId } from '@/config/brands'
import { getAdAccountIds, BRAND_MARKET_AD_ACCOUNTS } from '@/config/adAccounts'
import {
  getConfiguredBusinessManagersForBrand,
  getMetaTokenForAccount,
} from '@/config/metaTokens'
import {
  fetchAccountInsights,
  fetchAdsWithInsights,
  fetchAdAccounts,
  type AdAccount,
  type AdWithInsights,
} from '@/lib/gateways/MetaAdsGateway'
import { isValidMarket } from '@/lib/markets'
import {
  parseDateRangeFromQuery,
  toMetaInsightsParams,
  previousPeriod,
} from '@/lib/meta/dateRange'
import {
  sumKpis,
  sumDailySeries,
  computeKpiDelta,
  pickTopAds,
  pickTopByType,
  pickUnderperformers,
  summarizeAccount,
  DEFAULT_TOP_CRITERIA,
  type AccountKpis,
  type AdLeaderboardEntry,
  type AccountSummary,
  type KpiDelta,
  type DailyPoint,
  type TopCriteria,
} from '@/lib/meta/aggregate'
import { convertToEur } from '@/lib/meta/fx'

const ADS_PER_ACCOUNT_LIMIT = 200
const CACHE_MAX_AGE_SECONDS = 300
const CACHE_STALE_WHILE_REVALIDATE_SECONDS = 60
const NO_TOKEN_STATUS = 503
const UPSTREAM_ERROR_STATUS = 502

interface SummaryResponse {
  readonly kpis: KpiDelta
  readonly byDay: readonly DailyPoint[]
  readonly byAccount: readonly AccountSummary[]
  readonly topAll: readonly AdLeaderboardEntry[]
  readonly topVideos: readonly AdLeaderboardEntry[]
  readonly topImages: readonly AdLeaderboardEntry[]
  readonly underperformers: readonly AdLeaderboardEntry[]
  readonly criteria: TopCriteria
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams

  const brandIdRaw = params.get('brandId')
  if (!brandIdRaw) {
    return NextResponse.json({ error: 'brandId query param is required' }, { status: 400 })
  }
  if (!isBrandId(brandIdRaw)) {
    return NextResponse.json({ error: `unknown brandId: ${brandIdRaw}` }, { status: 400 })
  }
  const brandId: BrandId = brandIdRaw

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

  const dateSelection = parseDateRangeFromQuery(params)
  const previousSelection = previousPeriod(dateSelection)
  const datePresent = toMetaInsightsParams(dateSelection)
  const datePast = toMetaInsightsParams(previousSelection)

  try {
    const accountsList = await fetchAllAccounts(brandId)
    const accountById = new Map(accountsList.map((a) => [a.id, a]))

    const targets = accountIds
      .map((id) => accountById.get(id))
      .filter((a): a is AdAccount => Boolean(a))

    const perAccount = await Promise.all(
      targets.map(async (account) => {
        const token = getMetaTokenForAccount(account.id)
        if (!token) {
          return null
        }
        const [currentInsights, previousInsights, ads] = await Promise.all([
          fetchAccountInsights(token, account.id, account.currency, datePresent, { daily: true }),
          fetchAccountInsights(token, account.id, account.currency, datePast, { daily: false }),
          fetchAdsWithInsights(token, account.id, account.currency, datePresent, { limit: ADS_PER_ACCOUNT_LIMIT }),
        ])
        return { account, currentInsights, previousInsights, ads }
      }),
    )
    const usable = perAccount.filter((x): x is NonNullable<typeof x> => x !== null)

    const currentKpis: readonly AccountKpis[] = usable.map((u) => ({
      accountId: u.account.id,
      currency: u.account.currency,
      ...u.currentInsights.totals,
    }))
    const previousKpis: readonly AccountKpis[] = usable.map((u) => ({
      accountId: u.account.id,
      currency: u.account.currency,
      ...u.previousInsights.totals,
    }))

    const byDay = sumDailySeries(
      usable.map((u) => ({
        currency: u.account.currency,
        daily: u.currentInsights.daily.map((d) => ({
          date: d.date,
          spend: d.spend,
          revenue: d.revenue,
        })),
      })),
    )

    const byAccount = usable.map((u) =>
      summarizeAccount(
        u.account,
        u.currentInsights.totals.spend,
        u.currentInsights.totals.revenue,
        u.ads.filter((a) => a.effectiveStatus === 'ACTIVE').length,
      ),
    )

    const allAdEntries = usable.flatMap((u) => u.ads.map(toLeaderboardEntry))
    const criteria = parseCriteriaFromQuery(params)

    const response: SummaryResponse = {
      kpis: computeKpiDelta(sumKpis(currentKpis), sumKpis(previousKpis)),
      byDay,
      byAccount: byAccount.sort((a, b) => b.spendEur - a.spendEur),
      topAll: pickTopAds(allAdEntries, criteria),
      topVideos: pickTopByType(allAdEntries, 'video', criteria),
      topImages: pickTopByType(allAdEntries, 'image', criteria),
      underperformers: pickUnderperformers(allAdEntries, criteria),
      criteria,
    }

    return NextResponse.json(response, { headers: edgeCacheHeaders() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: UPSTREAM_ERROR_STATUS })
  }
}

function resolveTargetAccounts(
  brandId: BrandId,
  marketRaw: string | null,
  accountRaw: string | null,
): readonly string[] {
  if (accountRaw) {
    return [accountRaw]
  }
  if (marketRaw && isValidMarket(marketRaw)) {
    return getAdAccountIds(brandId, marketRaw)
  }
  return Object.values(BRAND_MARKET_AD_ACCOUNTS[brandId] ?? {})
    .flat()
    .filter((id): id is string => Boolean(id))
}

async function fetchAllAccounts(brandId: BrandId): Promise<readonly AdAccount[]> {
  const configured = getConfiguredBusinessManagersForBrand(brandId)
  const lists = await Promise.all(configured.map(({ token }) => fetchAdAccounts(token)))
  const dedupe = new Map<string, AdAccount>()
  for (const account of lists.flat()) {
    if (!dedupe.has(account.id)) {
      dedupe.set(account.id, account)
    }
  }
  return Array.from(dedupe.values())
}

function toLeaderboardEntry(ad: AdWithInsights): AdLeaderboardEntry {
  const spendEur = convertToEur(ad.insights.spend, ad.currency)
  const revenueEur = convertToEur(ad.insights.revenue, ad.currency)
  return {
    adId: ad.id,
    name: ad.name,
    creativeType: ad.creativeType,
    thumbnailUrl: ad.thumbnailUrl,
    accountId: ad.accountId,
    spendEur,
    revenueEur,
    roas: spendEur > 0 ? revenueEur / spendEur : 0,
    status: ad.effectiveStatus,
  }
}

function parseCriteriaFromQuery(params: URLSearchParams): TopCriteria {
  const minSpend = numericParam(params, 'minSpend', DEFAULT_TOP_CRITERIA.minSpend)
  const topMinRoas = numericParam(params, 'minRoas', DEFAULT_TOP_CRITERIA.topMinRoas)
  const underMaxRoas = numericParam(params, 'underMaxRoas', DEFAULT_TOP_CRITERIA.underMaxRoas)
  return { minSpend, topMinRoas, underMaxRoas }
}

function numericParam(params: URLSearchParams, key: string, fallback: number): number {
  const raw = params.get(key)
  if (!raw) {
    return fallback
  }
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

function emptyResponse(): SummaryResponse {
  const empty = sumKpis([])
  return {
    kpis: computeKpiDelta(empty, empty),
    byDay: [],
    byAccount: [],
    topAll: [],
    topVideos: [],
    topImages: [],
    underperformers: [],
    criteria: DEFAULT_TOP_CRITERIA,
  }
}

function edgeCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': `s-maxage=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE_SECONDS}`,
  }
}
