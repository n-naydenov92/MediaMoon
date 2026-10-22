import type { Market } from '@/types'
import type { MetaAccountRef } from './types'

export function accountIdsForMarket(accounts: readonly MetaAccountRef[], market: Market): readonly string[] {
  return accounts.filter((account) => account.marketCode === market).map((account) => account.id)
}
