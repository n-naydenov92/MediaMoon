import type { KlaviyoBucketTotals } from '@/lib/gateways/KlaviyoGateway'
import type { KlaviyoBucketStats } from '@/types/dashboard'

export function sumBuckets(
  a: KlaviyoBucketTotals,
  b: KlaviyoBucketTotals,
): KlaviyoBucketTotals {
  return {
    recipients: a.recipients + b.recipients,
    delivered: a.delivered + b.delivered,
    opensUnique: a.opensUnique + b.opensUnique,
    clicksUnique: a.clicksUnique + b.clicksUnique,
    conversions: a.conversions + b.conversions,
    conversionValue: a.conversionValue + b.conversionValue,
  }
}

export function toBucketStats(totals: KlaviyoBucketTotals): KlaviyoBucketStats {
  const denominator = totals.delivered > 0 ? totals.delivered : totals.recipients
  return {
    sent: totals.recipients > 0 ? totals.recipients : null,
    openRate: denominator > 0 ? totals.opensUnique / denominator : null,
    clickRate: denominator > 0 ? totals.clicksUnique / denominator : null,
    attributedRevenue: totals.conversionValue > 0 ? totals.conversionValue : null,
    attributedOrders: totals.conversions > 0 ? totals.conversions : null,
  }
}
