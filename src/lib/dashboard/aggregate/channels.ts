import type {
  AdChannelStats,
  DashboardChannels,
  DashboardChannelsByDay,
  KlaviyoBucketStats,
  KlaviyoChannelStats,
} from '@/types/dashboard'
import type { MetaChannelTotals } from './types'

const EMPTY_AD_STATS: AdChannelStats = {
  wired: false,
  spend: null,
  revenue: null,
  roas: null,
  orders: null,
  cpo: null,
  ctr: null,
  checkoutRate: null,
  costPerVisitor: null,
}

const EMPTY_KLAVIYO_BUCKET: KlaviyoBucketStats = {
  sent: null,
  openRate: null,
  clickRate: null,
  attributedRevenue: null,
  attributedOrders: null,
}

const EMPTY_KLAVIYO_STATS: KlaviyoChannelStats = {
  wired: false,
  total: EMPTY_KLAVIYO_BUCKET,
  flows: EMPTY_KLAVIYO_BUCKET,
  campaigns: EMPTY_KLAVIYO_BUCKET,
}

export function buildChannelsByDay(meta: MetaChannelTotals): DashboardChannelsByDay {
  return {
    meta: meta.byDay.map((p) => ({
      date: p.date,
      spend: p.spendEur,
      revenue: p.revenueEur,
      orders: p.purchases,
      impressions: p.impressions,
      linkClicks: p.linkClicks,
      checkoutsInitiated: p.checkoutsInitiated,
    })),
  }
}

export function buildChannelsBreakdown(
  meta: MetaChannelTotals,
  klaviyo: KlaviyoChannelStats | null,
): DashboardChannels {
  const spend = meta.spendEur
  const revenue = meta.revenueEur
  const orders = meta.purchases
  const wired = spend > 0
  const roas = spend > 0 && revenue > 0 ? revenue / spend : null
  const cpo = spend > 0 && orders > 0 ? spend / orders : null
  const ctr = meta.impressions > 0 ? meta.linkClicks / meta.impressions : null
  const checkoutRate =
    meta.checkoutsInitiated > 0 && orders > 0 ? orders / meta.checkoutsInitiated : null
  const metaStats: AdChannelStats = wired
    ? {
      wired: true,
      spend,
      revenue: revenue > 0 ? revenue : null,
      roas,
      orders: orders > 0 ? orders : null,
      cpo,
      ctr,
      checkoutRate,
      costPerVisitor: null,
    }
    : EMPTY_AD_STATS
  return {
    meta: metaStats,
    googleAds: EMPTY_AD_STATS,
    klaviyo: klaviyo ?? EMPTY_KLAVIYO_STATS,
  }
}
