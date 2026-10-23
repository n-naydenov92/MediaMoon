import { loadEnvConfig } from '@next/env'
import { getDb } from '@/lib/db/client'
import { ALL_MARKETS } from '@/lib/markets'
import { accountIdsForSelection } from '@/lib/tenancy/selection'
import { configSource } from '@/lib/tenancy/source/configSource'
import { dbSource } from '@/lib/tenancy/source/dbSource'
import type { TenancySource } from '@/lib/tenancy/source/types'

// Compares everything the app reads from config with what the database returns,
// for every brand and every market selection. The switch to the database (A6)
// needs zero differences. Secret values are never read, only env var names.

type Snapshot = Readonly<Record<string, unknown>>

interface Difference {
  readonly where: string
  readonly config: string
  readonly db: string
}

loadEnvConfig(process.cwd())

async function main(): Promise<void> {
  console.log(`Comparing config with ${new URL(process.env.DATABASE_URL ?? '').hostname}`)
  const differences = await compareSources()
  await getDb().$disconnect()
  report(differences)
}

async function compareSources(): Promise<readonly Difference[]> {
  const configBrands = (await configSource.readBrands()).map((brand) => brand.id)
  const dbBrands = (await dbSource.readBrands()).map((brand) => brand.id)
  console.log(`Brand order: config ${configBrands.join(', ')} · db ${dbBrands.join(', ')}`)
  const brandSet = compare('brands', [...configBrands].sort(), [...dbBrands].sort())
  const perBrand = await Promise.all(configBrands.map(compareBrand))
  return [...brandSet, ...perBrand.flat()]
}

async function compareBrand(brandId: string): Promise<readonly Difference[]> {
  const accountIds = await metaAccountIdsOf(brandId)
  const [fromConfig, fromDb] = await Promise.all([
    snapshot(configSource, brandId, accountIds),
    snapshot(dbSource, brandId, accountIds),
  ])
  const keys = [...new Set([...Object.keys(fromConfig), ...Object.keys(fromDb)])]
  return keys.flatMap((key) => compare(`${brandId} · ${key}`, fromConfig[key], fromDb[key]))
}

// Every Meta account config knows for the brand, through its markets or its connections.
async function metaAccountIdsOf(brandId: string): Promise<readonly string[]> {
  const context = await configSource.readBrandContext(brandId)
  const connections = await configSource.readMetaConnections(brandId)
  const ids = [...(context?.metaAccounts ?? []).map((account) => account.id), ...connections.flatMap((c) => c.accountIds)]
  return [...new Set(ids)]
}

async function snapshot(source: TenancySource, brandId: string, accountIds: readonly string[]): Promise<Snapshot> {
  const context = await source.readBrandContext(brandId)
  const selections = [ALL_MARKETS, ...(context?.brand.markets ?? [])]
  const owners = await Promise.all(accountIds.map((id) => source.readMetaConnectionForAccount(id)))
  return {
    brand: context?.brand ?? null,
    marketNames: context?.marketNames ?? null,
    metaAccounts: context?.metaAccounts ?? null,
    googleAdsCustomers: context?.googleAdsCustomers ?? null,
    ...Object.fromEntries(selections.map((s) => [`meta ids [${s}]`, accountIdsForSelection(context?.metaAccounts ?? [], s)])),
    ...Object.fromEntries(selections.map((s) => [`google ids [${s}]`, accountIdsForSelection(context?.googleAdsCustomers ?? [], s)])),
    metaConnections: await source.readMetaConnections(brandId),
    ...Object.fromEntries(accountIds.map((id, i) => [`connection of ${id}`, owners[i]?.id ?? null])),
    commerce: await source.readCommerceProvider(brandId),
    analytics: await source.readAnalyticsProvider(brandId),
    klaviyo: await source.readKlaviyoProvider(brandId),
  }
}

function compare(where: string, fromConfig: unknown, fromDb: unknown): readonly Difference[] {
  const config = stableJson(fromConfig)
  const db = stableJson(fromDb)
  return config === db ? [] : [{ where, config, db }]
}

// Key order differs between object literals and database rows; values must not.
function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, inner: unknown) => {
    if (inner === null || typeof inner !== 'object' || Array.isArray(inner)) {
      return inner
    }
    return Object.fromEntries(Object.entries(inner).sort(([a], [b]) => a.localeCompare(b)))
  })
}

function report(differences: readonly Difference[]): void {
  for (const difference of differences) {
    console.log(`✗ ${difference.where}\n    config: ${difference.config}\n    db:     ${difference.db}`)
  }
  console.log(differences.length === 0 ? '✓ 0 differences' : `${differences.length} differences`)
  process.exitCode = differences.length === 0 ? 0 : 1
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
