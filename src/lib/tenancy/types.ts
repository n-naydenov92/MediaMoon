import type { BrandId } from '@/config/brands'
import type { BrandConfig } from '@/types'

export type Brand = BrandConfig & { readonly id: BrandId }

export interface BrandContext {
  readonly brand: Brand
}
