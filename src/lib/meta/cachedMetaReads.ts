import type { BrandId } from '@/config/brands'
import type { ConfiguredBusinessManager } from '@/config/metaTokens'
import { expireNow, withCache } from '@/lib/cache'
import {
  fetchAdAccounts,
  fetchDsaEntities,
  fetchInstagramAccountsForPage,
  fetchPages,
  fetchPixels,
  type AdAccount,
  type DsaEntities,
  type InstagramAccount,
  type Page,
  type Pixel,
} from '@/lib/gateways/MetaAdsGateway'

const SECONDS_PER_MINUTE = 60
const AD_ACCOUNTS_TTL_SECONDS = 10 * SECONDS_PER_MINUTE
const ASSET_LIST_TTL_SECONDS = 30 * SECONDS_PER_MINUTE
const META_ASSETS_TAG = 'meta_assets'

// Read-mostly Meta metadata, shared by every user of the same brand / Business Manager /
// account, so one fetch per TTL serves the whole team instead of one per page open.
// `/me/accounts` (pages) also counts toward the app-wide limit that blocks every brand.
// Keys never contain the token — it is resolved from the same identity upstream.
// Campaigns, ad sets and ads are deliberately not cached: they change with every launch.

export function getPagesCached(brandId: BrandId, token: string): Promise<readonly Page[]> {
  return cacheMetaAsset(`meta_pages_${brandId}`, ASSET_LIST_TTL_SECONDS, () => fetchPages(token))
}

export function getAdAccountsCached({ businessManager, token }: ConfiguredBusinessManager): Promise<readonly AdAccount[]> {
  return cacheMetaAsset(`meta_adaccounts_${businessManager.id}`, AD_ACCOUNTS_TTL_SECONDS, () => fetchAdAccounts(token))
}

export function getInstagramAccountsCached(pageId: string, token: string): Promise<readonly InstagramAccount[]> {
  return cacheMetaAsset(
    `meta_instagram_${pageId}`,
    ASSET_LIST_TTL_SECONDS,
    () => fetchInstagramAccountsForPage(token, pageId),
  )
}

export function getPixelsCached(accountId: string, token: string): Promise<readonly Pixel[]> {
  return cacheMetaAsset(`meta_pixels_${accountId}`, ASSET_LIST_TTL_SECONDS, () => fetchPixels(token, accountId))
}

export function getDsaEntitiesCached(accountId: string, token: string): Promise<DsaEntities> {
  return cacheMetaAsset(`meta_dsa_${accountId}`, ASSET_LIST_TTL_SECONDS, () => fetchDsaEntities(token, accountId))
}

// The Ads Creator's "Reload from Meta": every list above, for every brand, is read from
// Meta again on its next use.
export function expireMetaAssets(): void {
  expireNow(META_ASSETS_TAG)
}

// Every list goes through here, so expireMetaAssets() covers it.
function cacheMetaAsset<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  return withCache({ key, ttlSeconds, fetcher, tags: [META_ASSETS_TAG] })
}
