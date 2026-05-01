/**
 * Shared types across the application.
 * Module-specific types live inside the module folder.
 */

// ─── Roles (mirrors Clerk publicMetadata.role) ───────────────────────────────

export type UserRole = 'admin' | 'team' | 'stoichkov_only' | 'shtonova_only'

export const ALL_ROLES: readonly UserRole[] = [
  'admin',
  'team',
  'stoichkov_only',
  'shtonova_only',
] as const

// ─── Markets ────────────────────────────────────────────────────────────────

export type Market = 'BG' | 'ES' | 'WORLD'

export interface LanguageConfig {
  readonly hl: string
  readonly gl: string
  readonly ceid: string
}

// ─── Module Registry ─────────────────────────────────────────────────────────

export interface ModuleConfig {
  readonly id: string
  readonly label: string
  readonly icon: string
  readonly path: string
  readonly roles: readonly UserRole[]
  readonly color: string
  readonly children?: readonly ModuleConfig[]
  readonly global?: boolean
}

// ─── Brand Registry ──────────────────────────────────────────────────────────

export interface BrandConfig {
  readonly id: string           // URL-safe slug: 'stoitchkov'
  readonly label: string        // 'Stoitchkov Nutrition'
  readonly emoji: string        // '💪'
  readonly color: string        // '#FF6B35'
  readonly description: string
  readonly markets: readonly Market[]
}

// ─── Async State (discriminated union) ───────────────────────────────────────

export type AsyncState<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error'; readonly message: string }

// ─── RSS / News ──────────────────────────────────────────────────────────────

export interface RssArticle {
  readonly title: string
  readonly url: string
  readonly source: string
  readonly pubDate: string // ISO string for JSON-serialisability
  readonly market: Market
}

export type HeatLevel = 'viral' | 'hot' | 'normal'

export interface NewsCluster {
  readonly representativeTitle: string
  readonly articles: readonly RssArticle[]
  readonly coverage: number
  readonly trendsScore: number | null
  readonly heat: HeatLevel
  readonly score: number
  readonly market: Market
  readonly tabId: string
}

export interface NewsStats {
  readonly totalArticles: number
  readonly totalClusters: number
  readonly viralCount: number
  readonly hotCount: number
}

export interface SourceCounts {
  readonly googleNewsRss: number
  readonly searchApi: number
}

export type SourceKey = keyof SourceCounts

export interface SourceErrors {
  readonly googleNewsRss?: string
  readonly searchApi?: string
}

export interface NewsResult {
  readonly fetchedAt: string
  readonly cacheExpiresAt: string
  readonly tabId: string
  readonly market: Market
  readonly clusters: readonly NewsCluster[]
  readonly stats: NewsStats
  readonly sourceCounts: SourceCounts
  readonly sourceErrors: SourceErrors
}
