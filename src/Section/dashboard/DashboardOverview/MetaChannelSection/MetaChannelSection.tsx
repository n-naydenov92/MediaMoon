import { memo } from 'react'
import FacebookIcon from '@mui/icons-material/Facebook'
import { KpiTile, type SparkPoint } from '@/components/kpi'
import { formatEur } from '@/lib/meta/fx'
import type { AdChannelStats, MetaDailyPoint } from '@/types/dashboard'
import ChannelSection from '../../ChannelSection/ChannelSection'
import {
  formatInteger,
  formatIntegerValue,
  formatMoney,
  formatRate,
  formatRateValue,
  formatRoas,
  formatRoasValue,
} from '../../shared/dashboardFormatters'
import { pctDelta } from '../../shared/metricsDelta'
import { toSparkPoints } from '../../shared/sparkPoints'
import { checkoutRateOfDay, cpoOfDay, roasOfDay } from './helpers'

interface Props {
  readonly stats: AdChannelStats
  readonly previousStats?: AdChannelStats
  readonly byDay?: readonly MetaDailyPoint[]
  readonly comparisonEnabled: boolean
  readonly showSparklines: boolean
  readonly deltaLabel: string
}

export default memo(function MetaChannelSection({
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
    selector: (point: MetaDailyPoint) => number,
    isAvailable: boolean,
  ): readonly SparkPoint[] | undefined =>
    showSparklines && isAvailable && byDay && byDay.length > 1
      ? toSparkPoints(byDay, selector)
      : undefined

  return (
    <ChannelSection
      title="Meta Ads"
      icon={<FacebookIcon fontSize="small" />}
      status={stats.wired ? 'live' : 'not-wired'}
      tileCount={6}
      notWiredMessage="Meta Ads still has no spend data for this brand in the selected period."
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
        label="Checkout → Purchase"
        title="% of checkout-initiated sessions that completed purchase. Source: Meta Ads."
        value={formatRate(stats.checkoutRate)}
        delta={passDelta(pctDelta(stats.checkoutRate, previousStats?.checkoutRate))}
        deltaLabel={deltaLabel}
        points={sparkPoints(checkoutRateOfDay, stats.checkoutRate !== null)}
        formatValue={formatRateValue}
      />
    </ChannelSection>
  )
})
