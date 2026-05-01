import type { LanguageConfig, Market } from '@/types'

/**
 * Per-brand trending-news topic configuration.
 * Each brand has exactly one topic with markets, queries, and language settings.
 *
 * Adding a new brand topic: add one entry here. Nothing else is touched. (OCP)
 */
export interface BrandTopicConfig {
  readonly brandId: string
  readonly markets: readonly Market[]
  readonly queries: Readonly<Record<Market, string>>
  readonly language: Readonly<Record<Market, LanguageConfig>>
  /** SearchAPI.io Google News query per market. Searches full Google News index by keyword. */
  readonly searchApiQuery?: Readonly<Partial<Record<Market, string>>>
}

const LANGUAGE_DEFAULTS: Readonly<Record<Market, LanguageConfig>> = {
  BG: { hl: 'bg', gl: 'BG', ceid: 'BG:bg' },
  ES: { hl: 'es', gl: 'ES', ceid: 'ES:es' },
  WORLD: { hl: 'en', gl: 'US', ceid: 'US:en' },
}

export const BRAND_TOPICS: readonly BrandTopicConfig[] = [
  {
    brandId: 'stoitchkov',
    markets: ['BG', 'ES', 'WORLD'],
    queries: {
      BG: 'Христо Стоичков',
      ES: 'Hristo Stoitchkov OR Hristo Stoichkov OR Stoitchkov OR Stoichkov',
      WORLD: 'Hristo Stoitchkov OR Hristo Stoichkov OR Stoitchkov OR Stoichkov',
    },
    language: LANGUAGE_DEFAULTS,
    searchApiQuery: {
      BG: 'Христо Стоичков',
      ES: 'Hristo Stoitchkov OR Hristo Stoichkov OR Stoitchkov OR Stoichkov',
      WORLD: 'Hristo Stoitchkov OR Hristo Stoichkov OR Stoitchkov OR Stoichkov',
    },
  },
  {
    brandId: 'sapphire',
    markets: ['BG'],
    queries: {
      BG: 'Неделя Щонова OR "Д-р Неделя Щонова" OR Nedelia Shtonova OR "д-р Щонова"',
      ES: '',
      WORLD: '',
    },
    language: LANGUAGE_DEFAULTS,
    searchApiQuery: {
      BG: 'Неделя Щонова OR "Д-р Неделя Щонова" OR Nedelia Shtonova OR "д-р Щонова"',
    },
  },
  {
    brandId: 'thegreenbear',
    markets: ['BG'],
    queries: {
      BG: 'thegreenbear OR "the green bear"',
      ES: '',
      WORLD: '',
    },
    language: LANGUAGE_DEFAULTS,
    searchApiQuery: {
      BG: 'thegreenbear OR "the green bear"',
    },
  },
] as const

// ─── Query helpers ──────────────────────────────────────────────────────────

export function findBrandTopic(brandId: string): BrandTopicConfig | null {
  return BRAND_TOPICS.find((t) => t.brandId === brandId) ?? null
}
