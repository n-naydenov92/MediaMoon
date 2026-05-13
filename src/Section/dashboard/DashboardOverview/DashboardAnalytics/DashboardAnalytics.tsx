import { useCallback, useMemo } from 'react'
import Box from '@mui/material/Box'
import { KpiTile, type SparkPoint } from '@/components/kpi'
import { formatEur, formatPercentage } from '@/lib/meta/fx'
import type {
  DashboardAnalyticsData,
  DashboardDailyPoint,
  DashboardKpis,
} from '@/types/dashboard'
import AnalyticsDevices from '../AnalyticsDevices/AnalyticsDevices'
import AnalyticsFunnel from '../AnalyticsFunnel/AnalyticsFunnel'
import AnalyticsTopPages from '../AnalyticsTopPages/AnalyticsTopPages'
import AnalyticsTrafficSources from '../AnalyticsTrafficSources/AnalyticsTrafficSources'
import {
  arpuSelector,
  averageDailyArpu,
  averageDailyCartAR,
  cartARSelector,
  computeArpu,
  deriveAnalyticsKpis,
} from './helpers'
import BreakdownCard from '../../shared/BreakdownCard/BreakdownCard'
import {
  formatInteger,
  formatIntegerValue,
  formatMoney,
  formatRate,
  formatRateValue,
} from '../../shared/dashboardFormatters'
import { pctDelta } from '../../shared/metricsDelta'
import { toSparkPoints } from '../../shared/sparkPoints'
import styles from './DashboardAnalytics.module.css'

interface Props {
  readonly analytics?: DashboardAnalyticsData
  readonly previousAnalytics?: DashboardAnalyticsData
  readonly kpis: DashboardKpis
  readonly previousKpis: DashboardKpis
  readonly byDay: readonly DashboardDailyPoint[]
  readonly comparisonEnabled: boolean
  readonly showSparklines: boolean
  readonly deltaLabel: string
}

export default function DashboardAnalytics({
  analytics,
  previousAnalytics,
  kpis,
  previousKpis,
  byDay,
  comparisonEnabled,
  showSparklines,
  deltaLabel,
}: Props): JSX.Element {
  const analyticsKpis = useMemo(
    () => analytics?.kpis ?? deriveAnalyticsKpis(kpis, byDay),
    [analytics, kpis, byDay],
  )
  const previousAnalyticsKpis = previousAnalytics?.kpis
  const trafficSources = analytics?.trafficSources ?? []
  const devices = analytics?.devices ?? []
  const topLandingPages = analytics?.topLandingPages ?? []
  const funnel = analytics?.funnel ?? []
  const funnelByDay = useMemo(() => analytics?.funnelByDay ?? [], [analytics])
  const previousFunnelByDay = useMemo(
    () => previousAnalytics?.funnelByDay ?? [],
    [previousAnalytics],
  )

  const passDelta = useCallback(
    (value: number | undefined): number | undefined => (comparisonEnabled ? value : undefined),
    [comparisonEnabled],
  )
  const sparkPoints = useCallback(
    (
      build: () => readonly SparkPoint[],
      isAvailable: boolean,
    ): readonly SparkPoint[] | undefined =>
      (showSparklines && isAvailable && byDay.length > 1 ? build() : undefined),
    [showSparklines, byDay.length],
  )

  const newUsersShare = useMemo(() => {
    if (
      analyticsKpis.newUsers === null
      || analyticsKpis.activeUsers === null
      || analyticsKpis.activeUsers <= 0
    ) {
      return null
    }
    return analyticsKpis.newUsers / analyticsKpis.activeUsers
  }, [analyticsKpis])
  const newUsersTooltip = newUsersShare === null
    ? 'First-time visitors in the period (Google Analytics)'
    : `${formatPercentage(newUsersShare, 1)} of total active users are first-time visitors`

  const cartAR = useMemo(() => averageDailyCartAR(funnelByDay), [funnelByDay])
  const previousCartAR = useMemo(
    () => averageDailyCartAR(previousFunnelByDay),
    [previousFunnelByDay],
  )
  const cartARTooltip = cartAR === null
    ? 'Share of users who added to cart but did not complete purchase'
    : 'Average daily add-to-cart abandonment = mean of daily (1 − purchases ÷ add-to-cart users). Lower is better.'

  const arpu = useMemo(() => averageDailyArpu(byDay), [byDay])
  const previousArpu = useMemo(
    () => computeArpu(previousKpis.revenue, previousAnalyticsKpis?.activeUsers ?? null),
    [previousKpis.revenue, previousAnalyticsKpis],
  )

  return (
    <Box className={styles.root}>
      <Box className={styles.kpiGrid}>
        <KpiTile
          label="Active users"
          title="Unique active users in the selected period (Google Analytics)"
          value={formatInteger(analyticsKpis.activeUsers)}
          delta={passDelta(pctDelta(analyticsKpis.activeUsers, previousAnalyticsKpis?.activeUsers))}
          deltaLabel={deltaLabel}
          points={sparkPoints(() => toSparkPoints(byDay, (p) => p.activeUsers), analyticsKpis.activeUsers !== null)}
          formatValue={formatIntegerValue}
        />
        <KpiTile
          label="New users"
          title={newUsersTooltip}
          value={formatInteger(analyticsKpis.newUsers)}
          delta={passDelta(pctDelta(analyticsKpis.newUsers, previousAnalyticsKpis?.newUsers))}
          deltaLabel={deltaLabel}
          points={sparkPoints(() => toSparkPoints(byDay, (p) => p.newUsers), analyticsKpis.newUsers !== null)}
          formatValue={formatIntegerValue}
        />
        <KpiTile
          label="Add-to-cart AR"
          title={cartARTooltip}
          value={formatRate(cartAR)}
          delta={passDelta(pctDelta(cartAR, previousCartAR))}
          deltaLabel={deltaLabel}
          points={sparkPoints(() => toSparkPoints(funnelByDay, cartARSelector), cartAR !== null)}
          formatValue={formatRateValue}
        />
        <KpiTile
          label="ARPU"
          title="Average Revenue Per User = Woo revenue ÷ GA4 active users"
          value={formatMoney(arpu)}
          delta={passDelta(pctDelta(arpu, previousArpu))}
          deltaLabel={deltaLabel}
          points={sparkPoints(() => toSparkPoints(byDay, arpuSelector), arpu !== null)}
          formatValue={formatEur}
        />
        <KpiTile
          label="Average bounce rate"
          title="Average daily bounce rate (Google Analytics)"
          value={formatRate(analyticsKpis.bounceRate)}
          delta={passDelta(pctDelta(analyticsKpis.bounceRate, previousAnalyticsKpis?.bounceRate))}
          deltaLabel={deltaLabel}
          points={sparkPoints(() => toSparkPoints(byDay, (p) => p.bounceRate), analyticsKpis.bounceRate !== null)}
          formatValue={formatRateValue}
        />
        <KpiTile
          label="First-time purchasers"
          title="Users who made their first purchase in this period (GA4 firstTimePurchasers)"
          value={formatInteger(analyticsKpis.firstTimePurchasers)}
          delta={passDelta(pctDelta(
            analyticsKpis.firstTimePurchasers,
            previousAnalyticsKpis?.firstTimePurchasers,
          ))}
          deltaLabel={deltaLabel}
          points={sparkPoints(
            () => toSparkPoints(byDay, (p) => p.firstTimePurchasers),
            analyticsKpis.firstTimePurchasers !== null,
          )}
          formatValue={formatIntegerValue}
        />
      </Box>

      <Box className={styles.breakdownRow}>
        <BreakdownCard title="Traffic by source (active users)">
          <AnalyticsTrafficSources sources={trafficSources} />
        </BreakdownCard>
        <Box className={styles.middleColumn}>
          <BreakdownCard title="Devices">
            <AnalyticsDevices devices={devices} />
          </BreakdownCard>
          <BreakdownCard title="Conversion funnel">
            <AnalyticsFunnel stages={funnel} />
          </BreakdownCard>
        </Box>
        <BreakdownCard title="Top landing pages">
          <AnalyticsTopPages pages={topLandingPages} />
        </BreakdownCard>
      </Box>
    </Box>
  )
}
