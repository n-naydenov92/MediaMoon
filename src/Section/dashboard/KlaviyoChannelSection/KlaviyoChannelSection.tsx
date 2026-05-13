'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined'
import type { KlaviyoChannelStats } from '@/types/dashboard'
import ChannelSection from '../ChannelSection/ChannelSection'
import { formatInteger, formatMoney, formatRate } from '../shared/dashboardFormatters'
import { pctDelta } from '../shared/metricsDelta'
import EngagementTile from './EngagementTile/EngagementTile'
import HeroWithBreakdown from './HeroWithBreakdown/HeroWithBreakdown'
import { absolutePercent, shareOfTotal } from './helpers'
import styles from './KlaviyoChannelSection.module.css'

interface Props {
  readonly stats: KlaviyoChannelStats
  readonly previousStats?: KlaviyoChannelStats
  readonly comparisonEnabled: boolean
  readonly deltaLabel: string
}

export default memo(function KlaviyoChannelSection({
  stats,
  previousStats,
  comparisonEnabled,
  deltaLabel,
}: Props): JSX.Element {
  const passDelta = (value: number | undefined): number | undefined =>
    !comparisonEnabled ? undefined : value

  const { total, flows, campaigns } = stats
  const prevTotal = previousStats?.total

  const revenue = shareOfTotal(campaigns.attributedRevenue, flows.attributedRevenue)
  const orders = shareOfTotal(campaigns.attributedOrders, flows.attributedOrders)
  const sent = shareOfTotal(campaigns.sent, flows.sent)

  return (
    <ChannelSection
      title="Klaviyo"
      icon={<MailOutlineIcon fontSize="small" />}
      status={stats.wired ? 'live' : 'not-wired'}
      notWiredMessage="Klaviyo is not connected for this brand yet."
    >
      <Box className={styles.container}>
        <Box className={styles.splitRow}>
          <HeroWithBreakdown
            label="Attributed revenue"
            totalValue={formatMoney(total.attributedRevenue)}
            delta={passDelta(pctDelta(total.attributedRevenue, prevTotal?.attributedRevenue))}
            deltaLabel={deltaLabel}
            campaignsValue={formatMoney(campaigns.attributedRevenue)}
            campaignsPercent={revenue.campaignsPct}
            flowsValue={formatMoney(flows.attributedRevenue)}
            flowsPercent={revenue.flowsPct}
          />
          <HeroWithBreakdown
            label="Attributed orders"
            totalValue={formatInteger(total.attributedOrders)}
            delta={passDelta(pctDelta(total.attributedOrders, prevTotal?.attributedOrders))}
            deltaLabel={deltaLabel}
            campaignsValue={formatInteger(campaigns.attributedOrders)}
            campaignsPercent={orders.campaignsPct}
            flowsValue={formatInteger(flows.attributedOrders)}
            flowsPercent={orders.flowsPct}
          />
        </Box>

        <Box className={styles.splitRow}>
          <EngagementTile
            icon={<SendOutlinedIcon fontSize="small" />}
            label="Sent"
            totalValue={formatInteger(total.sent)}
            delta={passDelta(pctDelta(total.sent, prevTotal?.sent))}
            deltaLabel={deltaLabel}
            campaignsValue={formatInteger(campaigns.sent)}
            campaignsPercent={sent.campaignsPct}
            flowsValue={formatInteger(flows.sent)}
            flowsPercent={sent.flowsPct}
          />
          <EngagementTile
            icon={<DraftsOutlinedIcon fontSize="small" />}
            label="Open rate"
            totalValue={formatRate(total.openRate)}
            delta={passDelta(pctDelta(total.openRate, prevTotal?.openRate))}
            deltaLabel={deltaLabel}
            campaignsValue={formatRate(campaigns.openRate)}
            campaignsPercent={absolutePercent(campaigns.openRate)}
            flowsValue={formatRate(flows.openRate)}
            flowsPercent={absolutePercent(flows.openRate)}
          />
        </Box>
      </Box>
    </ChannelSection>
  )
})
