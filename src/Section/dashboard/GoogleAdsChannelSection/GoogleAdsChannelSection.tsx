import { memo } from 'react'
import GoogleIcon from '@mui/icons-material/Google'
import { KpiTile } from '@/components/kpi'
import type { AdChannelStats } from '@/types/dashboard'
import ChannelSection from '../ChannelSection'
import { formatInteger, formatMoney, formatRoas } from '../shared/dashboardFormatters'
import { pctDelta } from '../shared/metricsDelta'

interface Props {
  readonly stats: AdChannelStats
  readonly previousStats?: AdChannelStats
  readonly comparisonEnabled: boolean
  readonly deltaLabel: string
}

function GoogleAdsChannelSection({
  stats,
  previousStats,
  comparisonEnabled,
  deltaLabel,
}: Props): JSX.Element {
  const passDelta = (value: number | undefined): number | undefined =>
    !comparisonEnabled ? undefined : value

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
      />
      <KpiTile
        label="Revenue"
        value={formatMoney(stats.revenue)}
        delta={passDelta(pctDelta(stats.revenue, previousStats?.revenue))}
        deltaLabel={deltaLabel}
      />
      <KpiTile
        label="ROAS"
        value={formatRoas(stats.roas)}
        delta={passDelta(pctDelta(stats.roas, previousStats?.roas))}
        deltaLabel={deltaLabel}
      />
      <KpiTile
        label="Orders"
        value={formatInteger(stats.orders)}
        delta={passDelta(pctDelta(stats.orders, previousStats?.orders))}
        deltaLabel={deltaLabel}
      />
      <KpiTile
        label="CPO"
        title="Cost per Order"
        value={formatMoney(stats.cpo)}
        delta={passDelta(pctDelta(stats.cpo, previousStats?.cpo))}
        deltaLabel={deltaLabel}
      />
      <KpiTile
        label="Cost per visitor"
        title="Ad spend ÷ ad clicks. Source: Google Ads (pending integration)."
        value={formatMoney(stats.costPerVisitor)}
        delta={passDelta(pctDelta(stats.costPerVisitor, previousStats?.costPerVisitor))}
        deltaLabel={deltaLabel}
      />
    </ChannelSection>
  )
}

export default memo(GoogleAdsChannelSection)
