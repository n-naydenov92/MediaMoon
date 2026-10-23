import { BRAND_MARKET_AD_ACCOUNTS } from '@/config/adAccounts'
import { getAnalyticsProviderEntry } from '@/config/analyticsProviders'
import { BRAND_REGISTRY } from '@/config/brands'
import { getCommerceProviderEntry, type CommerceProviderEntry } from '@/config/commerceProviders'
import { BRAND_MARKET_GOOGLE_ADS_CUSTOMERS } from '@/config/googleAdsAccounts'
import { getKlaviyoProviderEntry } from '@/config/klaviyoProviders'
import { MARKET_NAMES } from '@/config/markets'
import { BUSINESS_MANAGERS } from '@/config/metaBusinessManagers'
import type { ConnectionProvider } from '@/generated/prisma/client'
import { isAllowedSecretEnvVar } from '@/lib/tenancy/secretEnvVars'

export interface MarketPlan {
  readonly code: string
  readonly name: string
}

export interface BrandPlan {
  readonly id: string
  readonly name: string
  readonly emoji: string
  readonly color: string
  readonly description: string
  readonly currency: string
  readonly timezone: string
  readonly markets: readonly MarketPlan[]
}

export interface AdAccountPlan {
  readonly externalId: string
  readonly brandId: string
  readonly marketCode: string | null
}

export interface ConnectionPlan {
  readonly id: string
  readonly provider: ConnectionProvider
  readonly label: string
  readonly brandId: string | null
  readonly config: Readonly<Record<string, string>>
  // Role → env var name, e.g. { token: 'META_TOKEN_SAPPHIRE' }.
  readonly secretEnvVars: Readonly<Record<string, string>>
  readonly adAccounts: readonly AdAccountPlan[]
}

export interface WorkspacePlan {
  readonly slug: string
  readonly name: string
  readonly brands: readonly BrandPlan[]
  readonly connections: readonly ConnectionPlan[]
}

interface WorkspaceGroup {
  readonly slug: string
  readonly name: string
  readonly brandIds: readonly string[]
}

type IdsByMarket = Partial<Record<string, readonly string[]>>

// Today's brands, grouped into workspaces for the migration. The grouping is
// temporary and is revisited once the core works.
const WORKSPACE_GROUPS: readonly WorkspaceGroup[] = [
  { slug: 'naydenov-group', name: 'Naydenov Group', brandIds: ['stoitchkov', 'thegreenbear', 'sapphire'] },
  { slug: 'moni-trade', name: 'Moni Trade', brandIds: ['monitrade'] },
  { slug: 'bubullincas', name: 'Bubullincas', brandIds: ['bubullincas'] },
]

// Every brand today sells in Bulgaria; brands without a shop config get these.
const DEFAULT_CURRENCY = 'EUR'
const DEFAULT_TIMEZONE = 'Europe/Sofia'

// The developer token stays app-level; the rest belongs to the manager account.
const GOOGLE_ADS_SECRET_ENV_VARS = {
  clientId: 'GOOGLE_ADS_CLIENT_ID',
  clientSecret: 'GOOGLE_ADS_CLIENT_SECRET',
  refreshToken: 'GOOGLE_ADS_REFRESH_TOKEN',
  loginCustomerId: 'GOOGLE_ADS_LOGIN_CUSTOMER_ID',
}

export function buildSeedPlan(): readonly WorkspacePlan[] {
  return WORKSPACE_GROUPS.map((group) => ({
    slug: group.slug,
    name: group.name,
    brands: group.brandIds.map(toBrandPlan),
    connections: [...group.brandIds.flatMap(brandConnections), ...present(googleAdsConnection(group))],
  }))
}

export function assertSecretNamesAllowed(plan: readonly WorkspacePlan[]): void {
  const names = plan.flatMap((workspace) => workspace.connections.flatMap((c) => Object.values(c.secretEnvVars)))
  const refused = names.filter((name) => !isAllowedSecretEnvVar(name))
  if (refused.length > 0) {
    throw new Error(`Secret env var names outside the allowlist: ${refused.join(', ')}`)
  }
}

function toBrandPlan(brandId: string): BrandPlan {
  const brand = BRAND_REGISTRY.find((entry) => entry.id === brandId)
  if (!brand) {
    throw new Error(`Unknown brand ${brandId}`)
  }
  const commerce = getCommerceProviderEntry(brandId)
  return {
    id: brand.id,
    name: brand.label,
    emoji: brand.emoji,
    color: brand.color,
    description: brand.description,
    currency: commerce?.currency ?? DEFAULT_CURRENCY,
    timezone: commerce?.timezone ?? DEFAULT_TIMEZONE,
    markets: brand.markets.map((code) => ({ code, name: MARKET_NAMES[code] ?? code })),
  }
}

function brandConnections(brandId: string): readonly ConnectionPlan[] {
  return [
    ...metaConnections(brandId),
    ...present(ga4Connection(brandId)),
    ...present(commerceConnection(brandId)),
    ...present(klaviyoConnection(brandId)),
  ]
}

function metaConnections(brandId: string): readonly ConnectionPlan[] {
  const accountsByMarket = BRAND_MARKET_AD_ACCOUNTS[brandId] ?? {}
  return BUSINESS_MANAGERS.filter((bm) => bm.brandId === brandId).map((bm) => ({
    id: bm.id,
    provider: 'META',
    label: bm.label,
    brandId,
    config: {},
    secretEnvVars: { token: bm.tokenEnvVar },
    adAccounts: bm.accountIds.map((externalId) => ({
      externalId,
      brandId,
      marketCode: marketOf(accountsByMarket, externalId),
    })),
  }))
}

function ga4Connection(brandId: string): ConnectionPlan | null {
  const entry = getAnalyticsProviderEntry(brandId)
  if (!entry) {
    return null
  }
  return {
    id: `ga4-${brandId}`,
    provider: 'GA4',
    label: 'Google Analytics 4',
    brandId,
    config: { timezone: entry.timezone },
    secretEnvVars: { propertyId: entry.propertyEnvVar },
    adAccounts: [],
  }
}

function commerceConnection(brandId: string): ConnectionPlan | null {
  const entry = getCommerceProviderEntry(brandId)
  if (!entry) {
    return null
  }
  return {
    id: `${entry.kind}-${brandId}`,
    provider: entry.kind === 'woocommerce' ? 'WOOCOMMERCE' : 'SHOPIFY',
    label: entry.kind === 'woocommerce' ? 'WooCommerce' : 'Shopify',
    brandId,
    config: { currency: entry.currency, timezone: entry.timezone },
    secretEnvVars: commerceSecretEnvVars(entry),
    adAccounts: [],
  }
}

function commerceSecretEnvVars(entry: CommerceProviderEntry): Readonly<Record<string, string>> {
  if (entry.kind === 'woocommerce') {
    return { url: entry.urlEnvVar, key: entry.keyEnvVar, secret: entry.secretEnvVar }
  }
  return { url: entry.urlEnvVar, clientId: entry.clientIdEnvVar, clientSecret: entry.clientSecretEnvVar }
}

function klaviyoConnection(brandId: string): ConnectionPlan | null {
  const entry = getKlaviyoProviderEntry(brandId)
  if (!entry) {
    return null
  }
  return {
    id: `klaviyo-${brandId}`,
    provider: 'KLAVIYO',
    label: 'Klaviyo',
    brandId,
    config: { integrationName: entry.integrationName },
    secretEnvVars: { apiKey: entry.apiKeyEnvVar },
    adAccounts: [],
  }
}

// One manager account serves every brand of the workspace that runs Google Ads.
function googleAdsConnection(group: WorkspaceGroup): ConnectionPlan | null {
  const adAccounts = group.brandIds.flatMap(googleAdsCustomers)
  if (adAccounts.length === 0) {
    return null
  }
  return {
    id: `google-ads-${group.slug}`,
    provider: 'GOOGLE_ADS',
    label: 'Google Ads manager account',
    brandId: null,
    config: {},
    secretEnvVars: GOOGLE_ADS_SECRET_ENV_VARS,
    adAccounts,
  }
}

function googleAdsCustomers(brandId: string): readonly AdAccountPlan[] {
  const byMarket: IdsByMarket = BRAND_MARKET_GOOGLE_ADS_CUSTOMERS[brandId] ?? {}
  return Object.entries(byMarket).flatMap(([marketCode, ids]) =>
    (ids ?? []).map((externalId) => ({ externalId, brandId, marketCode })))
}

function marketOf(byMarket: IdsByMarket, accountId: string): string | null {
  const entry = Object.entries(byMarket).find(([, ids]) => ids?.includes(accountId))
  return entry ? entry[0] : null
}

function present<T>(value: T | null): readonly T[] {
  return value ? [value] : []
}
