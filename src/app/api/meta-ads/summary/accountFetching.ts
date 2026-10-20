import type { BrandId } from '@/config/brands'
import { getConfiguredBusinessManagersForBrand } from '@/config/metaTokens'
import {
  fetchAdAccounts,
  fetchAdsWithInsights,
  type AdAccount,
  type AdWithInsights,
} from '@/lib/gateways/MetaAdsGateway'
import type { AdLeaderboardEntry } from '@/lib/meta/aggregate'
import { convertToEur } from '@/lib/meta/fx'

const AD_INSIGHTS_PAGE_SIZE = 200

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

// Ad-level insights are Meta's heaviest call and the one that fails intermittently even
// after retries. Losing it only costs this account's leaderboard rows, so it resolves to
// null (reported to the client) instead of failing the KPIs and chart along with it.
export async function fetchAdsOrNull(
  token: string,
  account: AdAccount,
  options: { readonly dateParams: Record<string, string>; readonly minSpend: number },
): Promise<readonly AdWithInsights[] | null> {
  try {
    return await fetchAdsWithInsights(token, account.id, account.currency, options.dateParams, {
      limit: AD_INSIGHTS_PAGE_SIZE,
      filters: [{ field: 'spend', operator: 'GREATER_THAN', value: options.minSpend }],
    })
  } catch {
    return null
  }
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
