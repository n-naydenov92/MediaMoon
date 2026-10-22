import 'server-only'
import { readBrand, readBrands } from './source/configSource'
import type { Brand, BrandContext } from './types'

// The single read path for customer data (ADR 0002). It is backed by the config
// files today; the database replaces the source without changing these signatures.
export async function listBrands(): Promise<readonly Brand[]> {
  return readBrands()
}

export async function getBrandContext(brandId: string): Promise<BrandContext | null> {
  const brand = readBrand(brandId)
  return brand ? { brand } : null
}
