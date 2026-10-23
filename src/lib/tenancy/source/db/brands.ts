import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { getDb } from '@/lib/db/client'
import type { Brand, BrandContext } from '../../types'
import { ACTIVE_BRAND, BY_CREATION } from './shared'

const WITH_MARKETS = {
  markets: { orderBy: { code: 'asc' } },
} satisfies Prisma.BrandInclude

const WITH_MARKET_ACCOUNTS = {
  markets: { orderBy: { code: 'asc' }, include: { adAccounts: { orderBy: BY_CREATION } } },
} satisfies Prisma.BrandInclude

type BrandRow = Prisma.BrandGetPayload<{ include: typeof WITH_MARKETS }>
type BrandContextRow = Prisma.BrandGetPayload<{ include: typeof WITH_MARKET_ACCOUNTS }>

export async function readBrands(): Promise<readonly Brand[]> {
  const rows = await getDb().brand.findMany({ where: ACTIVE_BRAND, include: WITH_MARKETS, orderBy: BY_CREATION })
  return rows.map(toBrand)
}

// One query for the brand, its markets and every ad account they serve.
export async function readBrandContext(brandId: string): Promise<BrandContext | null> {
  const row = await getDb().brand.findFirst({
    where: { id: brandId, ...ACTIVE_BRAND },
    include: WITH_MARKET_ACCOUNTS,
  })
  return row ? toBrandContext(row) : null
}

function toBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    label: row.name,
    emoji: row.emoji,
    color: row.color,
    description: row.description,
    markets: row.markets.map((market) => market.code),
  }
}

function toBrandContext(row: BrandContextRow): BrandContext {
  const accounts = row.markets.flatMap((market) =>
    market.adAccounts.map((account) => ({ ...account, marketCode: market.code })))
  return {
    brand: toBrand(row),
    marketNames: Object.fromEntries(row.markets.map((market) => [market.code, market.name])),
    metaAccounts: accounts
      .filter((account) => account.provider === 'META')
      .map((account) => ({ id: account.externalId, marketCode: account.marketCode, connectionId: account.connectionId })),
    googleAdsCustomers: accounts
      .filter((account) => account.provider === 'GOOGLE_ADS')
      .map((account) => ({ id: account.externalId, marketCode: account.marketCode })),
  }
}
