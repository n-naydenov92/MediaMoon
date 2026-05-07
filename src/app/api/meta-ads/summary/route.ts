import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getConfiguredBusinessManagersForBrand, getMetaTokenForAccount } from '@/config/metaTokens'
import {
  countActiveAdsInAccount,
  fetchAccountInsights,
  fetchAdsWithInsights,
  type AdAccount,
} from '@/lib/gateways/MetaAdsGateway'
import {
  parseDateRangeFromQuery,
  toMetaInsightsParams,
  previousPeriod,
} from '@/lib/meta/dateRange'
import {
  computeKpiDelta,
  pickTopAds,
  pickTopByType,
  pickUnderperformers,
  summarizeAccount,
  sumDailySeries,
  sumKpis,
  type AccountKpis,
} from '@/lib/meta/aggregate'
import { fetchAllAccounts, toLeaderboardEntry } from './accountFetching'
import { parseBrandId, parseCriteriaFromQuery, resolveTargetAccounts } from './queryParsing'
import {
  edgeCacheHeaders,
  emptyResponse,
  type SummaryResponse,
} from './summaryResponse'

const ADS_PER_ACCOUNT_LIMIT = 200
const NO_TOKEN_STATUS = 503
const UPSTREAM_ERROR_STATUS = 502

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
  const previousSelection = previousPeriod(dateSelection)
  const datePresent = toMetaInsightsParams(dateSelection)
  const datePast = toMetaInsightsParams(previousSelection)
  const presetForCriteria = dateSelection.kind === 'preset' ? dateSelection.preset : ''
  const criteria = parseCriteriaFromQuery(params, presetForCriteria)

  const accountIds = resolveTargetAccounts(brandId, params.get('market'), params.get('account'))
  if (accountIds.length === 0) {
    return NextResponse.json(emptyResponse(criteria), { headers: edgeCacheHeaders() })
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

    const perAccount = await Promise.all(
      targets.map(async (account) => {
        const token = getMetaTokenForAccount(account.id)
        if (!token) {
          return null
        }
        const [currentInsights, previousInsights, ads, activeAdsCount] = await Promise.all([
          fetchAccountInsights(token, account.id, account.currency, datePresent, { daily: true }),
          fetchAccountInsights(token, account.id, account.currency, datePast, { daily: false }),
          fetchAdsWithInsights(token, account.id, account.currency, datePresent, {
            limit: ADS_PER_ACCOUNT_LIMIT,
            filters: [{ field: 'spend', operator: 'GREATER_THAN', value: criteria.minSpend }],
          }),
          countActiveAdsInAccount(token, account.id),
        ])
        return { account, currentInsights, previousInsights, ads, activeAdsCount }
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
          purchases: d.purchases,
          impressions: d.impressions,
          clicks: d.clicks,
        })),
      })),
    )

    const byAccount = usable.map((u) =>
      summarizeAccount(
        u.account,
        u.currentInsights.totals.spend,
        u.currentInsights.totals.revenue,
        u.activeAdsCount,
      ),
    )

    const allAdEntries = usable.flatMap((u) => u.ads.map(toLeaderboardEntry))

    const response: SummaryResponse = {
      kpis: computeKpiDelta(sumKpis(currentKpis), sumKpis(previousKpis)),
      byDay,
      byAccount: byAccount.sort((a, b) => b.spendEur - a.spendEur),
      topAll: pickTopAds(allAdEntries, criteria),
      topVideos: pickTopByType(allAdEntries, 'video', criteria),
      topImages: pickTopByType(allAdEntries, 'image', criteria),
      underperformers: pickUnderperformers(allAdEntries, criteria),
      criteria,
      fetchedAt: Date.now(),
    }

    return NextResponse.json(response, { headers: edgeCacheHeaders() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: UPSTREAM_ERROR_STATUS })
  }
}
