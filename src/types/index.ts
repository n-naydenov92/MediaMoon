/**
 * Shared types across the application.
 * Module-specific types live inside the module folder.
 */

// ─── Roles (mirrors Clerk publicMetadata.role) ───────────────────────────────

export type UserRole =
  | 'admin'
  | 'team'
  | 'creative_analyst'
  | 'bubullincas'

export const ALL_ROLES: readonly UserRole[] = [
  'admin',
  'team',
  'creative_analyst',
  'bubullincas',
] as const

// ─── Markets ────────────────────────────────────────────────────────────────

export type Market = 'BG' | 'ES' | 'WORLD'

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

// ─── Sidebar Navigation Tree ─────────────────────────────────────────────────

export interface NavLink {
  readonly kind: 'link'
  readonly id: string
  readonly label: string
  readonly icon: string
  readonly pathSuffix: string
  readonly roles: readonly UserRole[]
  readonly disabled?: boolean
}

export interface NavDrilldown {
  readonly kind: 'drilldown'
  readonly id: string
  readonly label: string
  readonly icon: string
  readonly roles: readonly UserRole[]
  readonly panel: NavPanel
}

export type NavItem = NavLink | NavDrilldown

export interface NavSection {
  readonly id: string
  readonly label: string
  readonly items: readonly NavItem[]
}

export interface NavPanel {
  readonly id: string
  readonly title: string
  readonly sections: readonly NavSection[]
}

// ─── Brand Registry ──────────────────────────────────────────────────────────

export interface BrandConfig {
  readonly id: string // URL-safe slug: 'stoitchkov'
  readonly label: string // 'Stoitchkov Nutrition'
  readonly emoji: string // '💪'
  readonly color: string // '#FF6B35'
  readonly description: string
  readonly markets: readonly Market[]
}
