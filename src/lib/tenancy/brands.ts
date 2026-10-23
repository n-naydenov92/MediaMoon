import 'server-only'
import { cache } from 'react'
import { activeSource } from './source/activeSource'
import type { Brand, BrandContext } from './types'

// The single read path for customer data (ADR 0002). The source behind it is
// switched in one place (source/activeSource). cache() lets the server components
// of one request share a single read; route handlers simply read.
export const listBrands = cache(async (): Promise<readonly Brand[]> => activeSource.readBrands())

export const getBrandContext = cache(
  async (brandId: string): Promise<BrandContext | null> => activeSource.readBrandContext(brandId),
)
