import type { BrandConfig } from '@/types'

export function filterBrands(
  brands: readonly BrandConfig[],
  query: string,
): readonly BrandConfig[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return brands
  }
  return brands.filter((brand) => {
    const haystack = [brand.label, brand.description, ...brand.markets].join(' ').toLowerCase()
    return haystack.includes(normalizedQuery)
  })
}
