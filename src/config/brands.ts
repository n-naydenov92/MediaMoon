import type { BrandConfig } from '@/types'

export const BRAND_REGISTRY: readonly BrandConfig[] = [
  {
    id: 'stoitchkov',
    label: 'Stoitchkov Nutrition',
    emoji: '💪',
    color: '#FF6B35',
    description: 'Performance nutrition brand',
    markets: ['BG', 'ES', 'WORLD'],
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
]

export function findBrandById(id: string): BrandConfig | null {
  return BRAND_REGISTRY.find((b) => b.id === id) ?? null
}
