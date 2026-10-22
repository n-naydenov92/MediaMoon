import 'server-only'
import { BRAND_MARKET_AD_ACCOUNTS } from '@/config/adAccounts'
import { BRAND_REGISTRY, findBrandById } from '@/config/brands'
import {
  BUSINESS_MANAGERS,
  getBusinessManagerForAccount,
  type MetaBusinessManager,
} from '@/config/metaBusinessManagers'
import type { Market } from '@/types'
import type { Brand, MetaAccountRef } from '../types'

export type MetaConnectionRecord = MetaBusinessManager

export function readBrands(): readonly Brand[] {
  return BRAND_REGISTRY
}

export function readBrand(brandId: string): Brand | null {
  return findBrandById(brandId)
}

export function readMetaAccounts(brand: Brand): readonly MetaAccountRef[] {
  const byMarket = BRAND_MARKET_AD_ACCOUNTS[brand.id]
  return (Object.keys(byMarket) as Market[]).flatMap((marketCode) =>
    (byMarket[marketCode] ?? []).map((id) => toMetaAccountRef(id, marketCode)))
}

export function readMetaConnections(brandId: string): readonly MetaConnectionRecord[] {
  return BUSINESS_MANAGERS.filter((bm) => bm.brandId === brandId)
}

export function readMetaConnectionForAccount(accountId: string): MetaConnectionRecord | null {
  return getBusinessManagerForAccount(accountId)
}

function toMetaAccountRef(id: string, marketCode: Market): MetaAccountRef {
  return { id, marketCode, connectionId: getBusinessManagerForAccount(id)?.id ?? null }
}
