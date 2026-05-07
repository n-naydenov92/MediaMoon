import { convertToEur } from '../fx'

export interface AccountKpis {
  readonly accountId: string
  readonly currency: string
  readonly spend: number
  readonly revenue: number
  readonly purchases: number
  readonly impressions: number
  readonly clicks: number
  readonly linkClicks: number
  readonly landingPageViews: number
  readonly addsToCart: number
  readonly checkoutsInitiated: number
}

export interface AggregatedKpis {
  readonly spendEur: number
  readonly revenueEur: number
  readonly roas: number
  readonly purchases: number
  readonly impressions: number
  readonly clicks: number
  readonly linkClicks: number
  readonly landingPageViews: number
  readonly addsToCart: number
  readonly checkoutsInitiated: number
  readonly ctr: number
  readonly linkCtr: number
  readonly cpmEur: number
  readonly cpcEur: number
  readonly costPerLpvEur: number
}

export interface KpiDelta {
  readonly current: AggregatedKpis
  readonly previous: AggregatedKpis
  readonly spendDelta: number
  readonly revenueDelta: number
  readonly roasDelta: number
  readonly purchasesDelta: number
}

export function sumKpis(perAccount: readonly AccountKpis[]): AggregatedKpis {
  const totals = perAccount.reduce(
    (acc, a) => ({
      spendEur: acc.spendEur + convertToEur(a.spend, a.currency),
      revenueEur: acc.revenueEur + convertToEur(a.revenue, a.currency),
      purchases: acc.purchases + a.purchases,
      impressions: acc.impressions + a.impressions,
      clicks: acc.clicks + a.clicks,
      linkClicks: acc.linkClicks + a.linkClicks,
      landingPageViews: acc.landingPageViews + a.landingPageViews,
      addsToCart: acc.addsToCart + a.addsToCart,
      checkoutsInitiated: acc.checkoutsInitiated + a.checkoutsInitiated,
    }),
    {
      spendEur: 0,
      revenueEur: 0,
      purchases: 0,
      impressions: 0,
      clicks: 0,
      linkClicks: 0,
      landingPageViews: 0,
      addsToCart: 0,
      checkoutsInitiated: 0,
    },
  )
  const roas = totals.spendEur > 0 ? totals.revenueEur / totals.spendEur : 0
  const ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0
  const linkCtr = totals.impressions > 0 ? totals.linkClicks / totals.impressions : 0
  const cpmEur = totals.impressions > 0 ? (totals.spendEur / totals.impressions) * 1000 : 0
  const cpcEur = totals.clicks > 0 ? totals.spendEur / totals.clicks : 0
  const costPerLpvEur = totals.landingPageViews > 0 ? totals.spendEur / totals.landingPageViews : 0
  return { ...totals, roas, ctr, linkCtr, cpmEur, cpcEur, costPerLpvEur }
}

export function computeKpiDelta(current: AggregatedKpis, previous: AggregatedKpis): KpiDelta {
  return {
    current,
    previous,
    spendDelta: relativeDelta(current.spendEur, previous.spendEur),
    revenueDelta: relativeDelta(current.revenueEur, previous.revenueEur),
    roasDelta: relativeDelta(current.roas, previous.roas),
    purchasesDelta: relativeDelta(current.purchases, previous.purchases),
  }
}

export function relativeDelta(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 1
  }
  return (current - previous) / previous
}
