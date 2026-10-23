import 'server-only'
import type { KlaviyoIntegrationName } from '@/config/klaviyoProviders'
import type { Connection, ConnectionProvider, Prisma } from '@/generated/prisma/client'
import { getDb } from '@/lib/db/client'
import { normalizeAccountId } from '@/lib/meta/accountId'
import type {
  AnalyticsRecord,
  CommerceRecord,
  CommerceRecordBase,
  KlaviyoRecord,
  MetaConnectionRecord,
  ShopifyRecord,
  WooCommerceRecord,
} from '../types'
import { ACTIVE_BRAND, BY_CREATION, jsonString, secretEnvVar } from './shared'

const WITH_ACCOUNT_IDS = {
  adAccounts: { orderBy: BY_CREATION, select: { externalId: true } },
} satisfies Prisma.ConnectionInclude

type MetaConnectionRow = Prisma.ConnectionGetPayload<{ include: typeof WITH_ACCOUNT_IDS }>

const KLAVIYO_INTEGRATIONS: readonly KlaviyoIntegrationName[] = ['WooCommerce', 'Shopify']

export async function readMetaConnections(brandId: string): Promise<readonly MetaConnectionRecord[]> {
  const rows = await getDb().connection.findMany({
    where: { brandId, provider: 'META', brand: ACTIVE_BRAND },
    include: WITH_ACCOUNT_IDS,
    orderBy: BY_CREATION,
  })
  return rows.flatMap((row) => toMetaConnectionRecord(row) ?? [])
}

export async function readMetaConnectionForAccount(accountId: string): Promise<MetaConnectionRecord | null> {
  const account = await getDb().adAccount.findFirst({
    where: { provider: 'META', externalId: normalizeAccountId(accountId), connection: { brand: ACTIVE_BRAND } },
    include: { connection: { include: WITH_ACCOUNT_IDS } },
    orderBy: BY_CREATION,
  })
  return account ? toMetaConnectionRecord(account.connection) : null
}

export async function readCommerceProvider(brandId: string): Promise<CommerceRecord | null> {
  const row = await findBrandConnection(brandId, ['WOOCOMMERCE', 'SHOPIFY'])
  return row ? toCommerceRecord(row) : null
}

export async function readAnalyticsProvider(brandId: string): Promise<AnalyticsRecord | null> {
  const row = await findBrandConnection(brandId, ['GA4'])
  return row ? toAnalyticsRecord(row) : null
}

export async function readKlaviyoProvider(brandId: string): Promise<KlaviyoRecord | null> {
  const row = await findBrandConnection(brandId, ['KLAVIYO'])
  return row ? toKlaviyoRecord(row) : null
}

async function findBrandConnection(
  brandId: string,
  providers: readonly ConnectionProvider[],
): Promise<Connection | null> {
  return getDb().connection.findFirst({
    where: { brandId, provider: { in: [...providers] }, brand: ACTIVE_BRAND },
    orderBy: BY_CREATION,
  })
}

function toMetaConnectionRecord(row: MetaConnectionRow): MetaConnectionRecord | null {
  if (!row.brandId) {
    return null
  }
  return {
    id: row.id,
    label: row.label,
    brandId: row.brandId,
    tokenEnvVar: secretEnvVar(row.secretEnvVars, 'token'),
    accountIds: row.adAccounts.map((account) => account.externalId),
  }
}

function toCommerceRecord(row: Connection): CommerceRecord | null {
  const base = toCommerceBase(row)
  if (!base) {
    return null
  }
  return row.provider === 'WOOCOMMERCE' ? toWooCommerceRecord(row, base) : toShopifyRecord(row, base)
}

function toCommerceBase(row: Connection): CommerceRecordBase | null {
  const urlEnvVar = secretEnvVar(row.secretEnvVars, 'url')
  const currency = jsonString(row.config, 'currency')
  const timezone = jsonString(row.config, 'timezone')
  if (!row.brandId || !urlEnvVar || !currency || !timezone) {
    return null
  }
  return { brandId: row.brandId, urlEnvVar, currency, timezone }
}

function toWooCommerceRecord(row: Connection, base: CommerceRecordBase): WooCommerceRecord | null {
  const keyEnvVar = secretEnvVar(row.secretEnvVars, 'key')
  const secretName = secretEnvVar(row.secretEnvVars, 'secret')
  if (!keyEnvVar || !secretName) {
    return null
  }
  return { ...base, kind: 'woocommerce', keyEnvVar, secretEnvVar: secretName }
}

function toShopifyRecord(row: Connection, base: CommerceRecordBase): ShopifyRecord | null {
  const clientIdEnvVar = secretEnvVar(row.secretEnvVars, 'clientId')
  const clientSecretEnvVar = secretEnvVar(row.secretEnvVars, 'clientSecret')
  if (!clientIdEnvVar || !clientSecretEnvVar) {
    return null
  }
  return { ...base, kind: 'shopify', clientIdEnvVar, clientSecretEnvVar }
}

function toAnalyticsRecord(row: Connection): AnalyticsRecord | null {
  const propertyEnvVar = secretEnvVar(row.secretEnvVars, 'propertyId')
  const timezone = jsonString(row.config, 'timezone')
  if (!row.brandId || !propertyEnvVar || !timezone) {
    return null
  }
  return { brandId: row.brandId, kind: 'ga4', propertyEnvVar, timezone }
}

function toKlaviyoRecord(row: Connection): KlaviyoRecord | null {
  const apiKeyEnvVar = secretEnvVar(row.secretEnvVars, 'apiKey')
  const configured = jsonString(row.config, 'integrationName')
  const integrationName = KLAVIYO_INTEGRATIONS.find((name) => name === configured)
  if (!row.brandId || !apiKeyEnvVar || !integrationName) {
    return null
  }
  return { brandId: row.brandId, apiKeyEnvVar, integrationName }
}
