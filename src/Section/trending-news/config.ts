import type { LanguageConfig, Market, UserRole } from '@/types'

/**
 * A tab is either an "overview" (aggregator) or a "topic" (fetches its own data).
 * Discriminated union ensures overview tabs cannot have queries, and vice versa.
 */
export type TabConfig = OverviewTabConfig | TopicTabConfig

export interface OverviewTabConfig {
  readonly id: string
  readonly label: string
  readonly roles: readonly UserRole[]
  readonly kind: 'overview'
}

export interface TopicTabConfig {
  readonly id: string
  readonly label: string
  readonly roles: readonly UserRole[]
  readonly kind: 'topic'
  readonly markets: readonly Market[]
  readonly queries: Readonly<Record<Market, string>>
  readonly language: Readonly<Record<Market, LanguageConfig>>
  /** SearchAPI.io Google News query per market. Searches full Google News index by keyword. */
  readonly searchApiQuery?: Readonly<Partial<Record<Market, string>>>
}

/**
 * Trending News tabs.
 *
 * Adding a new tab: add one object here. Nothing else is touched. (OCP)
 */
export const TRENDING_NEWS_TABS: readonly TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    roles: ['admin', 'team'],
    kind: 'overview',
  },
  {
    id: 'stoichkov',
    label: 'Hristo Stoichkov',
    roles: ['admin', 'team', 'stoichkov_only'],
    kind: 'topic',
    markets: ['BG', 'ES', 'WORLD'],
    queries: {
      BG: 'Христо Стоичков',
      ES: 'Hristo Stoitchkov OR Hristo Stoichkov OR Stoitchkov OR Stoichkov',
      WORLD: 'Hristo Stoitchkov OR Hristo Stoichkov OR Stoitchkov OR Stoichkov',
    },
    language: {
      BG: { hl: 'bg', gl: 'BG', ceid: 'BG:bg' },
      ES: { hl: 'es', gl: 'ES', ceid: 'ES:es' },
      WORLD: { hl: 'en', gl: 'US', ceid: 'US:en' },
    },
    searchApiQuery: {
      BG: 'Христо Стоичков',
      ES: 'Hristo Stoitchkov OR Hristo Stoichkov OR Stoitchkov OR Stoichkov',
      WORLD: 'Hristo Stoitchkov OR Hristo Stoichkov OR Stoitchkov OR Stoichkov',
    },
  },
  {
    id: 'shtonova',
    label: 'Nedelia Shtonova',
    roles: ['admin', 'team', 'shtonova_only'],
    kind: 'topic',
    markets: ['BG'],
    queries: {
      BG: 'Неделя Щонова OR "Д-р Неделя Щонова" OR Nedelia Shtonova OR "д-р Щонова"',
      ES: '',
      WORLD: '',
    },
    language: {
      BG: { hl: 'bg', gl: 'BG', ceid: 'BG:bg' },
      ES: { hl: 'es', gl: 'ES', ceid: 'ES:es' },
      WORLD: { hl: 'en', gl: 'US', ceid: 'US:en' },
    },
    searchApiQuery: {
      BG: 'Неделя Щонова OR "Д-р Неделя Щонова" OR Nedelia Shtonova OR "д-р Щонова"',
    },
  },
] as const

// ─── Query helpers ──────────────────────────────────────────────────────────

export function getTabsForRole(role: UserRole): readonly TabConfig[] {
  return TRENDING_NEWS_TABS.filter((t) => t.roles.includes(role))
}

export function findTabById(id: string): TabConfig | null {
  return TRENDING_NEWS_TABS.find((t) => t.id === id) ?? null
}

export function getTopicTabs(): readonly TopicTabConfig[] {
  return TRENDING_NEWS_TABS.filter(isTopicTab)
}

export function isTopicTab(tab: TabConfig): tab is TopicTabConfig {
  return tab.kind === 'topic'
}

export function isOverviewTab(tab: TabConfig): tab is OverviewTabConfig {
  return tab.kind === 'overview'
}
