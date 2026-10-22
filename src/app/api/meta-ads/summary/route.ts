import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getMetaConnectionsForBrand, getMetaTokenForAccount } from '@/lib/tenancy'
import {
  countActiveAdsInAccount,
  fetchAccountInsights,
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
import { fetchAdsOrNull, fetchAllAccounts, toLeaderboardEntry } from './accountFetching'
import { findBrandFromQuery, parseCriteriaFromQuery, resolveTargetAccounts } from './queryParsing'
import { emptyResponse, type SummaryResponse } from './summaryResponse'
import { metaErrorResponse } from '@/lib/meta/metaErrorResponse'

const NO_TOKEN_STATUS = 503

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams

  const ctx = await findBrandFromQuery(params.get('brandId'))
  if (!ctx) {
    return NextResponse.json(
      { error: 'brandId query param is required or unknown' },
      { status: 400 },
    )
  }
  const brandId = ctx.brand.id

  const dateSelection = parseDateRangeFromQuery(params)
  const previousSelection = previousPeriod(dateSelection)
  const datePresent = toMetaInsightsParams(dateSelection)
  const datePast = toMetaInsightsParams(previousSelection)
  const presetForCriteria = dateSelection.kind === 'preset' ? dateSelection.preset : ''
  const criteria = parseCriteriaFromQuery(params, presetForCriteria)

  const accountIds = resolveTargetAccounts(ctx, params.get('market'), params.get('account'))
  if (accountIds.length === 0) {
    return NextResponse.json(emptyResponse(criteria))
  }

  if ((await getMetaConnectionsForBrand(brandId)).length === 0) {
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
        const token = await getMetaTokenForAccount(account.id)
        if (!token) {
          return null
        }
        const [currentInsights, previousInsights, ads, activeAdsCount] = await Promise.all([
          fetchAccountInsights(token, account.id, account.currency, datePresent, { daily: true }),
          fetchAccountInsights(token, account.id, account.currency, datePast, { daily: false }),
          fetchAdsOrNull(token, account, { dateParams: datePresent, minSpend: criteria.minSpend }),
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

    const allAdEntries = usable.flatMap((u) => (u.ads ?? []).map(toLeaderboardEntry))
    const accountsMissingAds = usable.filter((u) => u.ads === null).map((u) => u.account.name)

    const response: SummaryResponse = {
      kpis: computeKpiDelta(sumKpis(currentKpis), sumKpis(previousKpis)),
      byDay,
      byAccount: byAccount.sort((a, b) => b.spendEur - a.spendEur),
      topAll: pickTopAds(allAdEntries, criteria),
      topVideos: pickTopByType(allAdEntries, 'video', criteria),
      topImages: pickTopByType(allAdEntries, 'image', criteria),
      underperformers: pickUnderperformers(allAdEntries, criteria),
      accountsMissingAds,
      criteria,
      fetchedAt: Date.now(),
    }

    return NextResponse.json(response)
  } catch (err) {
    return metaErrorResponse(err)
  }
}
