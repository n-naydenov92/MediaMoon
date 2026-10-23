import type { BrandConfig, BrandId } from '@/types'

// The app reads brands from the database. Only the Clerk-role access check
// (brandAccess) still uses this copy, until access moves to the database (B11).
const BRAND_REGISTRY: readonly (BrandConfig & { readonly id: BrandId })[] = [
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
  {
    id: 'monitrade',
    label: 'Moni Trade',
    emoji: '🧸',
    color: '#FBBF24',
    description: 'Children’s toys retailer (Cangaroo, Byox, MONI)',
    markets: ['BG'],
  },
]

export function isBrandId(id: string): id is BrandId {
  return BRAND_REGISTRY.some((b) => b.id === id)
}
