import type { BrandConfig } from '@/types'

export type BrandId = 'stoitchkov' | 'thegreenbear' | 'sapphire' | 'bubullincas'

export const BRAND_REGISTRY: readonly (BrandConfig & { readonly id: BrandId })[] = [
  {
    id: 'stoitchkov',
    label: 'Stoitchkov Nutrition',
    emoji: '💪',
    color: '#FF6B35',
    description: 'Performance nutrition brand',
    markets: ['BG', 'ES'],
  },
  {
    id: 'thegreenbear',
    label: 'Thegreenbear',
    emoji: '🐻',
    color: '#10B981',
    description: 'Sustainable lifestyle brand',
    markets: ['BG'],
  },
  {
    id: 'sapphire',
    label: 'Sapphire',
    emoji: '💎',
    color: '#1877F2',
    description: 'Luxury jewellery brand',
    markets: ['BG'],
  },
  {
    id: 'bubullincas',
    label: 'Bubullincas',
    emoji: '🐞',
    color: '#E63946',
    description: 'Bubullincas brand',
    markets: ['BG'],
  },
]

export function findBrandById(id: string): (BrandConfig & { readonly id: BrandId }) | null {
  return BRAND_REGISTRY.find((b) => b.id === id) ?? null
}

export function isBrandId(id: string): id is BrandId {
  return BRAND_REGISTRY.some((b) => b.id === id)
}
