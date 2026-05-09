import type { BrandId } from '@/config/brands'
import { getConfiguredBusinessManagersForBrand } from '@/config/metaTokens'
import { fetchAccountInsights, fetchAdAccounts } from '@/lib/gateways/MetaAdsGateway'
import { convertToEur } from '@/lib/meta/fx'
import { toMetaInsightsParams, type DateRangeSelection } from '@/lib/meta/dateRange'
import type { SpendTotals } from './aggregate'

interface AccountTarget {
  readonly token: string
  readonly accountId: string
  readonly currency: string
}

interface PeriodTotals {
  readonly spendEur: number
  readonly byDay: ReadonlyMap<string, number>
}

const EMPTY: SpendTotals = { spendEur: 0, byDay: [] }

export async function fetchSpendBothPeriods(
  brandId: BrandId,
  current: DateRangeSelection,
  previous: DateRangeSelection,
): Promise<{ current: SpendTotals; previous: SpendTotals }> {
  const targets = await resolveTargetAccounts(brandId)
  if (targets.length === 0) {
    return { current: EMPTY, previous: EMPTY }
  }

  const currentParams = toMetaInsightsParams(current)
  const previousParams = toMetaInsightsParams(previous)

  const [currentInsights, previousInsights] = await Promise.all([
    fetchAllInsights(targets, currentParams, true),
    fetchAllInsights(targets, previousParams, false),
  ])

  return {
    current: toSpendTotals(currentInsights),
    previous: toSpendTotals(previousInsights),
  }
}

async function resolveTargetAccounts(brandId: BrandId): Promise<readonly AccountTarget[]> {
  const configured = getConfiguredBusinessManagersForBrand(brandId)
  if (configured.length === 0) {
    return []
  }
  const perBm = await Promise.all(
    configured.map(async ({ businessManager, token }) => {
      const accounts = await fetchAdAccounts(token)
      const allowed = new Set(businessManager.accountIds)
      return accounts
        .filter((a) => allowed.has(a.id))
        .map((account) => ({ token, accountId: account.id, currency: account.currency }))
    }),
  )
  return perBm.flat()
}

async function fetchAllInsights(
  targets: readonly AccountTarget[],
  dateParams: Record<string, string>,
  daily: boolean,
): Promise<PeriodTotals> {
  const results = await Promise.all(
    targets.map((t) =>
      fetchAccountInsights(t.token, t.accountId, t.currency, dateParams, { daily })
        .then((data) => ({ currency: t.currency, totals: data.totals, daily: data.daily }))
        .catch(() => null),
    ),
  )

  const byDay = new Map<string, number>()
  let spendEur = 0
  for (const entry of results) {
    if (!entry) {
      continue
    }
    spendEur += convertToEur(entry.totals.spend, entry.currency)
    for (const point of entry.daily) {
      const eur = convertToEur(point.spend, entry.currency)
      byDay.set(point.date, (byDay.get(point.date) ?? 0) + eur)
    }
  }
  return { spendEur, byDay }
}

function toSpendTotals(period: PeriodTotals): SpendTotals {
  const byDay = Array.from(period.byDay.entries())
    .map(([date, spendEur]) => ({ date, spendEur }))
    .sort((a, b) => a.date.localeCompare(b.date))
  return { spendEur: period.spendEur, byDay }
}
