import 'server-only'
import { BRAND_REGISTRY, findBrandById } from '@/config/brands'
import type { Brand } from '../types'

export function readBrands(): readonly Brand[] {
  return BRAND_REGISTRY
}

export function readBrand(brandId: string): Brand | null {
  return findBrandById(brandId)
}
