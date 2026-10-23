import 'server-only'
import type { CommerceProviderConfig } from '@/types/commerce'
import { activeSource } from '../source/activeSource'
import type { ShopifyRecord, WooCommerceRecord } from '../source/types'
import { readSecret } from './secrets'

export async function resolveCommerceConfig(brandId: string): Promise<CommerceProviderConfig | null> {
  const entry = await activeSource.readCommerceProvider(brandId)
  const storeUrlRaw = entry ? readSecret(entry.urlEnvVar) : null
  if (!entry || !storeUrlRaw) {
    return null
  }
  const storeUrl = storeUrlRaw.replace(/\/+$/, '')
  return entry.kind === 'woocommerce' ? toWooConfig(entry, storeUrl) : toShopifyConfig(entry, storeUrl)
}

function toWooConfig(entry: WooCommerceRecord, storeUrl: string): CommerceProviderConfig | null {
  const consumerKey = readSecret(entry.keyEnvVar)
  const consumerSecret = readSecret(entry.secretEnvVar)
  if (!consumerKey || !consumerSecret) {
    return null
  }
  const { currency, timezone } = entry
  return { kind: 'woocommerce', storeUrl, consumerKey, consumerSecret, currency, timezone }
}

function toShopifyConfig(entry: ShopifyRecord, storeUrl: string): CommerceProviderConfig | null {
  const clientId = readSecret(entry.clientIdEnvVar)
  const clientSecret = readSecret(entry.clientSecretEnvVar)
  if (!clientId || !clientSecret) {
    return null
  }
  const { currency, timezone } = entry
  return { kind: 'shopify', storeUrl, clientId, clientSecret, currency, timezone }
}
