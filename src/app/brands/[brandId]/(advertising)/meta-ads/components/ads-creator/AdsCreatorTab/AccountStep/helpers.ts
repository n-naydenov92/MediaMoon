import type { AdAccount } from '@/lib/gateways/MetaAdsGateway'
import { findMetaAccount } from '@/lib/tenancy/selection'
import type { MetaAccountRef } from '@/lib/tenancy/types'

const MARKET_SEPARATOR = ' · '

// Under "All markets" the list mixes every market's accounts, so each option leads
// with the market it serves (e.g. "ES · Stoitchkov ES").
export function marketPrefixedLabel(account: AdAccount, metaAccounts: readonly MetaAccountRef[]): string {
  const market = findMetaAccount(metaAccounts, account.id)?.marketCode
  return market ? `${market}${MARKET_SEPARATOR}${account.name}` : account.name
}
