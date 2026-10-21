import { buildUrl, callGraphApiWithHeaders } from './http'
import {
  parseGraphUsage,
  readUsageMeters,
  type MetaUsage,
  type UsageMeter,
} from './rateLimit'

// Two of the cheapest reads (1 point each) that between them return every counter Meta
// reports for an ad account: the ad set list carries the app-wide and the ad account's
// short-term usage, the account node the hourly business-use-case usage.
export async function fetchMetaUsage(token: string, accountId: string): Promise<MetaUsage> {
  const [adSets, account] = await Promise.all([
    callGraphApiWithHeaders<unknown>(buildUrl(`/${accountId}/adsets`, token, { fields: 'id', limit: '1' })),
    callGraphApiWithHeaders<unknown>(buildUrl(`/${accountId}`, token, { fields: 'id' })),
  ])
  const headers = [adSets.headers, account.headers]
  return {
    tier: headers.map(parseGraphUsage).find((usage) => usage.tier !== null)?.tier ?? null,
    meters: keepHighestPerKey(headers.flatMap(readUsageMeters)),
  }
}

function keepHighestPerKey(meters: readonly UsageMeter[]): readonly UsageMeter[] {
  const byKey = new Map<string, UsageMeter>()
  meters.forEach((meter) => {
    const current = byKey.get(meter.key)
    if (!current || meter.pct > current.pct) {
      byKey.set(meter.key, meter)
    }
  })
  return [...byKey.values()]
}
