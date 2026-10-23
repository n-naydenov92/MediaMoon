import 'server-only'
import { cache } from 'react'
import { readBrandContext, readBrands } from './source/db/brands'
import type { Brand, BrandContext } from './types'

// The single read path for customer data (ADR 0002), backed by the database.
// cache() lets the server components of one request share a single read; route
// handlers simply read.
export const listBrands = cache(async (): Promise<readonly Brand[]> => readBrands())

export const getBrandContext = cache(
  async (brandId: string): Promise<BrandContext | null> => readBrandContext(brandId),
)
