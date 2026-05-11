import Box from '@mui/material/Box'
import type {
  AdChannelStats,
  DashboardChannels,
  DashboardChannelsByDay,
  KlaviyoChannelStats,
  SpendBreakdownPoint,
} from '@/types/dashboard'
import GoogleAdsChannelSection from '../GoogleAdsChannelSection'
import KlaviyoChannelSection from '../KlaviyoChannelSection'
import MetaChannelSection from '../MetaChannelSection'
import styles from './DashboardChannelsBreakdown.module.css'

interface Props {
  readonly channels?: DashboardChannels
  readonly previousChannels?: DashboardChannels
  readonly channelsByDay?: DashboardChannelsByDay
  readonly spendBreakdown: readonly SpendBreakdownPoint[]
  readonly comparisonEnabled: boolean
  readonly showSparklines: boolean
  readonly deltaLabel: string
}

const EMPTY_KLAVIYO: KlaviyoChannelStats = {
  wired: false,
  sent: null,
  openRate: null,
  clickRate: null,
  attributedRevenue: null,
  attributedOrders: null,
}

function deriveAdChannel(
  channel: 'meta' | 'googleAds',
  spendBreakdown: readonly SpendBreakdownPoint[],
): AdChannelStats {
  const point = spendBreakdown.find((p) => p.channel === channel)
  const spend = point?.spend ?? null
  const wired = spend !== null && spend > 0
  return {
    wired,
    spend: wired ? spend : null,
    revenue: null,
    roas: null,
    orders: null,
    cpo: null,
    ctr: null,
    checkoutRate: null,
    costPerVisitor: null,
  }
}

export default function DashboardChannelsBreakdown({
  channels,
  previousChannels,
  channelsByDay,
  spendBreakdown,
  comparisonEnabled,
  showSparklines,
  deltaLabel,
}: Props): JSX.Element {
  const meta = channels?.meta ?? deriveAdChannel('meta', spendBreakdown)
  const googleAds = channels?.googleAds ?? deriveAdChannel('googleAds', spendBreakdown)
  const klaviyo = channels?.klaviyo ?? EMPTY_KLAVIYO

  return (
    <Box className={styles.stack}>
      <MetaChannelSection
        stats={meta}
        previousStats={previousChannels?.meta}
        byDay={channelsByDay?.meta}
        comparisonEnabled={comparisonEnabled}
        showSparklines={showSparklines}
        deltaLabel={deltaLabel}
      />
      <GoogleAdsChannelSection
        stats={googleAds}
        previousStats={previousChannels?.googleAds}
        comparisonEnabled={comparisonEnabled}
        deltaLabel={deltaLabel}
      />
      <KlaviyoChannelSection
        stats={klaviyo}
        previousStats={previousChannels?.klaviyo}
        comparisonEnabled={comparisonEnabled}
        deltaLabel={deltaLabel}
      />
    </Box>
  )
}
