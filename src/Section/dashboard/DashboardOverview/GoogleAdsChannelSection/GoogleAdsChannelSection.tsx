import { memo } from 'react'
import GoogleIcon from '@mui/icons-material/Google'
import KpiTile from '@/components/kpi/KpiTile/KpiTile'
import type { SparkPoint } from '@/components/kpi/KpiSparkline/KpiSparkline'
import { formatEur } from '@/lib/meta/fx'
import type { AdChannelStats, GoogleAdsDailyPoint } from '@/types/dashboard'
import ChannelSection from '../../ChannelSection/ChannelSection'
import {
  formatInteger,
  formatIntegerValue,
  formatMoney,
  formatRoas,
  formatRoasValue,
} from '../../shared/dashboardFormatters'
import { pctDelta } from '../../shared/metricsDelta'
import { toSparkPoints } from '../../shared/sparkPoints'
import { costPerVisitorOfDay, cpoOfDay, roasOfDay } from './helpers'

interface Props {
  readonly stats: AdChannelStats
  readonly previousStats?: AdChannelStats
  readonly byDay?: readonly GoogleAdsDailyPoint[]
  readonly comparisonEnabled: boolean
  readonly showSparklines: boolean
  readonly deltaLabel: string
}

export default memo(function GoogleAdsChannelSection({
  stats,
  previousStats,
  byDay,
  comparisonEnabled,
  showSparklines,
  deltaLabel,
}: Props): JSX.Element {
  const passDelta = (value: number | undefined): number | undefined =>
    !comparisonEnabled ? undefined : value
  const sparkPoints = (
    selector: (point: GoogleAdsDailyPoint) => number,
    isAvailable: boolean,
  ): readonly SparkPoint[] | undefined =>
    showSparklines && isAvailable && byDay && byDay.length > 1
      ? toSparkPoints(byDay, selector)
      : undefined

  return (
    <ChannelSection
      title="Google Ads"
      icon={<GoogleIcon fontSize="small" />}
      status={stats.wired ? 'live' : 'not-wired'}
      tileCount={6}
      notWiredMessage="Google Ads is not connected for this brand yet."
    >
      <KpiTile
        label="Spend"
        value={formatMoney(stats.spend)}
        delta={passDelta(pctDelta(stats.spend, previousStats?.spend))}
        deltaLabel={deltaLabel}
        points={sparkPoints((p) => p.spend, stats.spend !== null)}
        formatValue={formatEur}
      />
      <KpiTile
        label="Revenue"
        value={formatMoney(stats.revenue)}
        delta={passDelta(pctDelta(stats.revenue, previousStats?.revenue))}
        deltaLabel={deltaLabel}
        points={sparkPoints((p) => p.revenue, stats.revenue !== null)}
        formatValue={formatEur}
      />
      <KpiTile
        label="ROAS"
        value={formatRoas(stats.roas)}
        delta={passDelta(pctDelta(stats.roas, previousStats?.roas))}
        deltaLabel={deltaLabel}
        points={sparkPoints(roasOfDay, stats.roas !== null)}
        formatValue={formatRoasValue}
      />
      <KpiTile
        label="Orders"
        value={formatInteger(stats.orders)}
        delta={passDelta(pctDelta(stats.orders, previousStats?.orders))}
        deltaLabel={deltaLabel}
        points={sparkPoints((p) => p.orders, stats.orders !== null)}
        formatValue={formatIntegerValue}
      />
      <KpiTile
        label="CPO"
        title="Cost per Order"
        value={formatMoney(stats.cpo)}
        delta={passDelta(pctDelta(stats.cpo, previousStats?.cpo))}
        deltaLabel={deltaLabel}
        points={sparkPoints(cpoOfDay, stats.cpo !== null)}
        formatValue={formatEur}
      />
      <KpiTile
        label="Cost per visitor"
        title="Ad spend ÷ ad clicks. Source: Google Ads."
        value={formatMoney(stats.costPerVisitor)}
        delta={passDelta(pctDelta(stats.costPerVisitor, previousStats?.costPerVisitor))}
        deltaLabel={deltaLabel}
        points={sparkPoints(costPerVisitorOfDay, stats.costPerVisitor !== null)}
        formatValue={formatEur}
      />
    </ChannelSection>
  )
})
