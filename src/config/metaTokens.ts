import type { BrandId } from './brands'
import {
  getBusinessManagerForAccount,
  getBusinessManagersForBrand,
  type MetaBusinessManager,
} from './metaBusinessManagers'

export interface ConfiguredBusinessManager {
  readonly businessManager: MetaBusinessManager
  readonly token: string
}

function readEnvToken(envVar: string): string | null {
  const token = process.env[envVar]
  return token && token.length > 0 ? token : null
}

export function getConfiguredBusinessManagersForBrand(
  brandId: BrandId,
): readonly ConfiguredBusinessManager[] {
  return getBusinessManagersForBrand(brandId).flatMap((businessManager) => {
    const token = readEnvToken(businessManager.tokenEnvVar)
    return token ? [{ businessManager, token }] : []
  })
}

export function getMetaTokenForBrand(brandId: BrandId): string | null {
  return getConfiguredBusinessManagersForBrand(brandId)[0]?.token ?? null
}

export function getMetaTokenForAccount(accountId: string): string | null {
  const businessManager = getBusinessManagerForAccount(accountId)
  if (!businessManager) {
    return null
  }
  return readEnvToken(businessManager.tokenEnvVar)
}
