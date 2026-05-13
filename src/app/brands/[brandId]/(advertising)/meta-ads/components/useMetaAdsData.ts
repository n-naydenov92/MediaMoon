import { useEffect, useState } from 'react'
import type { Market } from '@/types'
import type { BrandId } from '@/config/brands'
import { getAdAccountIds } from '@/config/adAccounts'
import type { AdAccount, Campaign } from '@/lib/gateways/MetaAdsGateway'

const NO_TOKEN_STATUS = 503

export interface AccountBlock {
  readonly account: AdAccount
  readonly campaigns: readonly Campaign[]
}

export interface MarketBlock {
  readonly market: Market
  readonly accounts: readonly AccountBlock[]
  readonly missingAccountIds: readonly string[]
}

export interface MetaAdsData {
  readonly markets: readonly MarketBlock[]
  readonly unmappedMarkets: readonly Market[]
}

export type MetaAdsState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'no-token' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'success'; readonly data: MetaAdsData }

interface ApiError {
  error?: string
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, cache: 'no-store' })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError
    const error = new Error(body.error ?? `HTTP ${response.status}`) as Error & { status: number }
    error.status = response.status
    throw error
  }
  return response.json() as Promise<T>
}

async function fetchAccounts(brandId: BrandId, signal: AbortSignal): Promise<readonly AdAccount[]> {
  const { accounts } = await fetchJson<{ accounts: readonly AdAccount[] }>(
    `/api/meta-ads/accounts?brandId=${brandId}`,
    signal,
  )
  return accounts
}

async function fetchCampaigns(accountId: string, signal: AbortSignal): Promise<readonly Campaign[]> {
  const { campaigns } = await fetchJson<{ campaigns: readonly Campaign[] }>(
    `/api/meta-ads/campaigns?accountId=${accountId}`,
    signal,
  )
  return campaigns
}

type MarketResolution =
  | { readonly kind: 'mapped'; readonly block: MarketBlock }
  | { readonly kind: 'unmapped'; readonly market: Market }

async function resolveMarket(
  market: Market,
  brandId: BrandId,
  accountById: ReadonlyMap<string, AdAccount>,
  signal: AbortSignal,
): Promise<MarketResolution> {
  const configuredIds = getAdAccountIds(brandId, market)
  if (configuredIds.length === 0) {
    return { kind: 'unmapped', market }
  }
  const accounts: AdAccount[] = []
  const missingAccountIds: string[] = []
  for (const id of configuredIds) {
    const account = accountById.get(id)
    if (account) {
      accounts.push(account)
    } else {
      missingAccountIds.push(id)
    }
  }
  const accountBlocks = await Promise.all(
    accounts.map(async (account) => ({
      account,
      campaigns: await fetchCampaigns(account.id, signal),
    })),
  )
  return { kind: 'mapped', block: { market, accounts: accountBlocks, missingAccountIds } }
}

export function useMetaAdsData(
  brandId: BrandId | null,
  visibleMarkets: readonly Market[],
): MetaAdsState {
  const [state, setState] = useState<MetaAdsState>({ status: 'idle' })

  useEffect(() => {
    if (!brandId) {
      return
    }
    const controller = new AbortController()

    setState({ status: 'loading' })

    void (async () => {
      try {
        const accounts = await fetchAccounts(brandId, controller.signal)
        const accountById = new Map(accounts.map((a) => [a.id, a]))

        const resolutions = await Promise.all(
          visibleMarkets.map((market) =>
            resolveMarket(market, brandId, accountById, controller.signal),
          ),
        )

        const markets = resolutions
          .filter((r): r is Extract<MarketResolution, { kind: 'mapped' }> => r.kind === 'mapped')
          .map((r) => r.block)
        const unmappedMarkets = resolutions
          .filter((r): r is Extract<MarketResolution, { kind: 'unmapped' }> => r.kind === 'unmapped')
          .map((r) => r.market)

        setState({ status: 'success', data: { markets, unmappedMarkets } })
      } catch (err) {
        if (isAbortError(err)) {
          return
        }
        if (err instanceof Error && (err as Error & { status?: number }).status === NO_TOKEN_STATUS) {
          setState({ status: 'no-token' })
          return
        }
        const message = err instanceof Error ? err.message : 'Unknown error'
        setState({ status: 'error', message })
      }
    })()

    return () => controller.abort()
  }, [brandId, visibleMarkets])

  return state
}
