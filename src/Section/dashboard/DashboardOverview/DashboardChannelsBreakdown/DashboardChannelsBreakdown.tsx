import Box from '@mui/material/Box'
import type {
  DashboardChannels,
  DashboardChannelsByDay,
  KlaviyoBucketStats,
  KlaviyoChannelStats,
  SpendBreakdownPoint,
} from '@/types/dashboard'
import GoogleAdsChannelSection from '../GoogleAdsChannelSection/GoogleAdsChannelSection'
import KlaviyoChannelSection from '../../KlaviyoChannelSection/KlaviyoChannelSection'
import MetaChannelSection from '../MetaChannelSection/MetaChannelSection'
import { deriveAdChannel } from './helpers'
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

const EMPTY_KLAVIYO_BUCKET: KlaviyoBucketStats = {
  sent: null,
  openRate: null,
  clickRate: null,
  attributedRevenue: null,
  attributedOrders: null,
}

const EMPTY_KLAVIYO: KlaviyoChannelStats = {
  wired: false,
  total: EMPTY_KLAVIYO_BUCKET,
  flows: EMPTY_KLAVIYO_BUCKET,
  campaigns: EMPTY_KLAVIYO_BUCKET,
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
        byDay={channelsByDay?.googleAds}
        comparisonEnabled={comparisonEnabled}
        showSparklines={showSparklines}
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
