import type { Market } from '@/types'
import type { BrandId } from './brands'

type BrandMarketAccounts = Partial<Record<Market, readonly string[]>>

export const BRAND_MARKET_AD_ACCOUNTS: Record<BrandId, BrandMarketAccounts> = {
  stoitchkov: {
    BG: ['act_25619246591017712'],
    ES: ['act_1636391154174858'],
  },
  thegreenbear: {
    BG: ['act_222478775571065', 'act_1167235697880563', 'act_639771789949515'],
  },
  sapphire: {
    BG: ['act_734480455547742', 'act_1578892512968195'],
  },
  bubullincas: {
    BG: ['act_1073479967115320'],
  },
}

export function getAdAccountIds(brandId: BrandId, market: Market): readonly string[] {
  return BRAND_MARKET_AD_ACCOUNTS[brandId]?.[market] ?? []
}
