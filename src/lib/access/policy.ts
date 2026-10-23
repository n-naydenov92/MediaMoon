import type { ConnectionProvider } from '@/generated/prisma/enums'
import { isModuleEnabled, type AccessModule } from './modules'
import type { Permission } from './permissions'

const CREATOR: readonly Permission[] = ['meta-ads.creator.use']

/**
 * What each route under `src/app/api` accepts: any one of the listed permissions, held
 * for the brand and market the request is about. A test fails when a route has no
 * entry, so no route ships unguarded.
 */
export const API_RULES = {
  'brands/dashboard/summary': ['dashboard.view'],
  'brands/dashboard/products': ['dashboard.view'],
  'meta-ads/summary': ['meta-ads.overview.view'],
  'meta-ads/ads': ['meta-ads.performance.view'],
  // The creative preview, opened from Overview, Performance and the Ads Creator library.
  'meta-ads/insights': ['meta-ads.overview.view', 'meta-ads.performance.view', 'meta-ads.creator.use'],
  'meta-ads/accounts': CREATOR,
  'meta-ads/pages': CREATOR,
  'meta-ads/page-active-ads': CREATOR,
  'meta-ads/elements': CREATOR,
  'meta-ads/campaigns': CREATOR,
  'meta-ads/adsets': CREATOR,
  'meta-ads/adsets/[id]': CREATOR,
  'meta-ads/adsets/create': CREATOR,
  'meta-ads/adsets/duplicate': CREATOR,
  'meta-ads/dsa-entities': CREATOR,
  'meta-ads/instagram-accounts': CREATOR,
  'meta-ads/pixels': CREATOR,
  'meta-ads/usage': CREATOR,
  'meta-ads/publish': CREATOR,
  'meta-ads/reupload': CREATOR,
  'meta-ads/upload/start': CREATOR,
  'meta-ads/upload/chunk': CREATOR,
  'meta-ads/upload/finalize': CREATOR,
  'meta-ads/upload/image': CREATOR,
  'meta-ads/upload/video-thumbnail': CREATOR,
} satisfies Record<string, readonly Permission[]>

export type ApiRoute = keyof typeof API_RULES

export interface PageRule {
  /** The page's path under the brand; '' is the brand dashboard. */
  readonly path: string
  readonly module: AccessModule
  readonly permission: Permission
}

/** The brand's pages, in the order a brand opens on. */
export const PAGE_RULES: readonly PageRule[] = [
  { path: '', module: 'dashboard', permission: 'dashboard.view' },
  { path: 'meta-ads/overview', module: 'meta-ads', permission: 'meta-ads.overview.view' },
  { path: 'meta-ads/performance', module: 'meta-ads', permission: 'meta-ads.performance.view' },
  { path: 'meta-ads/ads-creator', module: 'meta-ads', permission: 'meta-ads.creator.use' },
  { path: 'google-ads', module: 'google-ads', permission: 'google-ads.view' },
]

/**
 * Where a brand opens for this person: the first page they hold the permission for, in a
 * module the brand has. `held` comes from `brandPermissions`. Null when no page is theirs.
 */
export function firstAccessiblePage(
  held: readonly Permission[],
  providers: readonly ConnectionProvider[],
): string | null {
  const page = PAGE_RULES.find((rule) => held.includes(rule.permission) && isModuleEnabled(rule.module, providers))
  return page ? page.path : null
}
