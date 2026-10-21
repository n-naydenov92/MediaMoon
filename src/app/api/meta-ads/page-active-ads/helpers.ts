import type { BrandId } from '@/config/brands'
import { getConfiguredBusinessManagersForBrand } from '@/config/metaTokens'

const PAGE_ID_PATTERN = /^\d+$/
const MAX_PAGE_IDS = 50

export function parsePageIds(raw: string | null): readonly string[] {
  if (!raw) {
    return []
  }
  const ids = raw.split(',').map((id) => id.trim()).filter((id) => PAGE_ID_PATTERN.test(id))
  return [...new Set(ids)].slice(0, MAX_PAGE_IDS)
}

// ads_volume hangs off an ad account, but the count it returns is Page-wide (every
// account), so the counts don't depend on which account the user picks. Uses the same
// BM as `getMetaTokenForBrand`, so the account is reachable by the token that listed
// the pages.
export function adsVolumeAccountId(brandId: BrandId): string | null {
  return getConfiguredBusinessManagersForBrand(brandId)[0]?.businessManager.accountIds[0] ?? null
}
