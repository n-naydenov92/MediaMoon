import type { BrandId } from '@/config/brands'
import { getConfiguredBusinessManagersForBrand } from '@/config/metaTokens'
import {
  fetchAdAccounts,
  type AdAccount,
  type AdWithInsights,
} from '@/lib/gateways/MetaAdsGateway'
import type { AdLeaderboardEntry } from '@/lib/meta/aggregate'
import { convertToEur } from '@/lib/meta/fx'

export async function fetchAllAccounts(brandId: BrandId): Promise<readonly AdAccount[]> {
  const configured = getConfiguredBusinessManagersForBrand(brandId)
  const lists = await Promise.all(configured.map(({ token }) => fetchAdAccounts(token)))
  const dedupe = new Map<string, AdAccount>()
  for (const account of lists.flat()) {
    if (!dedupe.has(account.id)) {
      dedupe.set(account.id, account)
    }
  }
  return Array.from(dedupe.values())
}

export function toLeaderboardEntry(ad: AdWithInsights): AdLeaderboardEntry {
  const spendEur = convertToEur(ad.insights.spend, ad.currency)
  const revenueEur = convertToEur(ad.insights.revenue, ad.currency)
  return {
    adId: ad.id,
    name: ad.name,
    creativeType: ad.creativeType,
    thumbnailUrl: ad.thumbnailUrl,
    accountId: ad.accountId,
    spendEur,
    revenueEur,
    roas: spendEur > 0 ? revenueEur / spendEur : 0,
    status: ad.effectiveStatus,
  }
}
