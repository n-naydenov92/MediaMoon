import type { BrandConfig, Market } from '@/types'
import { findBrandById } from '@/config/brands'
import { isValidMarket } from '@/lib/markets'
import { findBrandTopic, type BrandTopicConfig } from '@/Section/trending-news/config'

export interface ValidatedRequest {
  readonly topic: BrandTopicConfig
  readonly brand: BrandConfig
  readonly market: Market
}

export interface ValidationError {
  readonly error: string
  readonly status: number
}

export function validateBrandMarket(
  brandIdRaw: unknown,
  marketRaw: unknown,
): ValidatedRequest | ValidationError {
  if (typeof brandIdRaw !== 'string') {
    return { error: 'Unknown brand', status: 400 }
  }
  const topic = findBrandTopic(brandIdRaw)
  const brand = findBrandById(brandIdRaw)
  if (!topic || !brand) {
    return { error: 'Unknown brand', status: 400 }
  }
  if (!isValidMarket(marketRaw)) {
    return { error: 'Invalid market', status: 400 }
  }
  if (!brand.markets.includes(marketRaw)) {
    return { error: 'Market not supported for this brand', status: 400 }
  }
  return { topic, brand, market: marketRaw }
}

export function isValidationError(
  result: ValidatedRequest | ValidationError,
): result is ValidationError {
  return 'error' in result
}
