import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isBrandId, type BrandId } from '@/config/brands'
import { getAdAccountIds, BRAND_MARKET_AD_ACCOUNTS } from '@/config/adAccounts'
import {
  getConfiguredBusinessManagersForBrand,
  getMetaTokenForAccount,
} from '@/config/metaTokens'
import {
  fetchAccountInsights,
  fetchAdsWithDailyInsights,
  fetchAdAccounts,
  type AdAccount,
  type AdWithDailyInsights,
  type InsightsDailyPoint,
} from '@/lib/gateways/MetaAdsGateway'
import { isValidMarket } from '@/lib/markets'

const ADS_PER_ACCOUNT_LIMIT = 200
const WINDOW_DAYS = 90
const WINDOW_DAYS_PRESET = 'last_90d'
const CACHE_MAX_AGE_SECONDS = 300
const CACHE_STALE_WHILE_REVALIDATE_SECONDS = 60
const NO_TOKEN_STATUS = 503
const UPSTREAM_ERROR_STATUS = 502

export interface AccountWindow {
  readonly accountId: string
  readonly accountName: string
  readonly currency: string
  readonly daily: readonly InsightsDailyPoint[]
  readonly ads: readonly AdWithDailyInsights[]
}

export interface WindowResponse {
  readonly fetchedAt: number
  readonly windowDays: number
  readonly accounts: readonly AccountWindow[]
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams

  const brandIdRaw = params.get('brandId')
  if (!brandIdRaw) {
    return NextResponse.json({ error: 'brandId query param is required' }, { status: 400 })
  }
  if (!isBrandId(brandIdRaw)) {
    return NextResponse.json({ error: `unknown brandId: ${brandIdRaw}` }, { status: 400 })
  }
  const brandId: BrandId = brandIdRaw

  const accountIds = resolveTargetAccounts(brandId, params.get('market'), params.get('account'))
  if (accountIds.length === 0) {
    return NextResponse.json(emptyResponse(), { headers: edgeCacheHeaders() })
  }

  if (getConfiguredBusinessManagersForBrand(brandId).length === 0) {
    return NextResponse.json(
      { error: `Meta token not configured for brand "${brandId}"` },
      { status: NO_TOKEN_STATUS },
    )
  }

  try {
    const targets = await resolveTargetAccountObjects(brandId, accountIds)
    const perAccount = await Promise.all(targets.map(fetchAccountWindow))
    const response: WindowResponse = {
      fetchedAt: Date.now(),
      windowDays: WINDOW_DAYS,
      accounts: perAccount.filter((x): x is AccountWindow => x !== null),
    }
    return NextResponse.json(response, { headers: edgeCacheHeaders() })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: UPSTREAM_ERROR_STATUS })
  }
}

async function resolveTargetAccountObjects(
  brandId: BrandId,
  accountIds: readonly string[],
): Promise<readonly AdAccount[]> {
  const accountsList = await fetchAllAccounts(brandId)
  const accountById = new Map(accountsList.map((a) => [a.id, a]))
  return accountIds.map((id) => accountById.get(id)).filter((a): a is AdAccount => Boolean(a))
}

function resolveTargetAccounts(
  brandId: BrandId,
  marketRaw: string | null,
  accountRaw: string | null,
): readonly string[] {
  if (accountRaw) {
    return [accountRaw]
  }
  if (marketRaw && isValidMarket(marketRaw)) {
    return getAdAccountIds(brandId, marketRaw)
  }
  return Object.values(BRAND_MARKET_AD_ACCOUNTS[brandId] ?? {})
    .flat()
    .filter((id): id is string => Boolean(id))
}

async function fetchAllAccounts(brandId: BrandId): Promise<readonly AdAccount[]> {
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

function emptyResponse(): WindowResponse {
  return { fetchedAt: Date.now(), windowDays: WINDOW_DAYS, accounts: [] }
}

async function fetchAccountWindow(account: AdAccount): Promise<AccountWindow | null> {
  const token = getMetaTokenForAccount(account.id)
  if (!token) {
    return null
  }
  const dateParams = { date_preset: WINDOW_DAYS_PRESET }
  const [accountInsights, ads] = await Promise.all([
    fetchAccountInsights(token, account.id, account.currency, dateParams, { daily: true }),
    fetchAdsWithDailyInsights(token, account.id, account.currency, dateParams, {
      limit: ADS_PER_ACCOUNT_LIMIT,
    }),
  ])
  return {
    accountId: account.id,
    accountName: account.name,
    currency: account.currency,
    daily: accountInsights.daily,
    ads,
  }
}

function edgeCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': `s-maxage=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE_SECONDS}`,
  }
}
