import { getMetaConnectionsForBrand } from '@/lib/tenancy'

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
// connection as `resolveBrandToken`, so the account is reachable by the token that
// listed the pages.
export async function adsVolumeAccountId(brandId: string): Promise<string | null> {
  const [connection] = await getMetaConnectionsForBrand(brandId)
  return connection?.accountIds[0] ?? null
}
