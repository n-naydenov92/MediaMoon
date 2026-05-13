import { memo } from 'react'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import { KpiTile } from '@/components/kpi'
import type { KlaviyoChannelStats } from '@/types/dashboard'
import ChannelSection from '../ChannelSection'
import { formatInteger, formatMoney, formatRate } from '../shared/dashboardFormatters'
import { pctDelta } from '../shared/metricsDelta'

interface Props {
  readonly stats: KlaviyoChannelStats
  readonly previousStats?: KlaviyoChannelStats
  readonly comparisonEnabled: boolean
  readonly deltaLabel: string
}

function KlaviyoChannelSection({
  stats,
  previousStats,
  comparisonEnabled,
  deltaLabel,
}: Props): JSX.Element {
  const passDelta = (value: number | undefined): number | undefined =>
    !comparisonEnabled ? undefined : value

  return (
    <ChannelSection
      title="Klaviyo"
      icon={<MailOutlineIcon fontSize="small" />}
      status={stats.wired ? 'live' : 'not-wired'}
      tileCount={5}
      notWiredMessage="Klaviyo is not connected for this brand yet."
    >
      <KpiTile
        label="Sent"
        value={formatInteger(stats.sent)}
        delta={passDelta(pctDelta(stats.sent, previousStats?.sent))}
        deltaLabel={deltaLabel}
      />
      <KpiTile
        label="Open rate"
        value={formatRate(stats.openRate)}
        delta={passDelta(pctDelta(stats.openRate, previousStats?.openRate))}
        deltaLabel={deltaLabel}
      />
      <KpiTile
        label="Click rate"
        value={formatRate(stats.clickRate)}
        delta={passDelta(pctDelta(stats.clickRate, previousStats?.clickRate))}
        deltaLabel={deltaLabel}
      />
      <KpiTile
        label="Attributed revenue"
        title="Revenue attributed to Klaviyo flows and campaigns"
        value={formatMoney(stats.attributedRevenue)}
        delta={passDelta(pctDelta(stats.attributedRevenue, previousStats?.attributedRevenue))}
        deltaLabel={deltaLabel}
      />
      <KpiTile
        label="Attributed orders"
        value={formatInteger(stats.attributedOrders)}
        delta={passDelta(pctDelta(stats.attributedOrders, previousStats?.attributedOrders))}
        deltaLabel={deltaLabel}
      />
    </ChannelSection>
  )
}

export default memo(KlaviyoChannelSection)
