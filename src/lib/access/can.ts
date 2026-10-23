import { ALL_PERMISSIONS, PERMISSIONS, type Permission } from './permissions'
import { covers, scopeAtLevel } from './scope'
import type { AccessContext, AccessTarget, Assignment, BrandRef, Scope } from './types'

const BRAND_AND_MARKET_PERMISSIONS = ALL_PERMISSIONS.filter(
  (permission) => PERMISSIONS[permission].level !== 'workspace',
)

/**
 * Whether the person may use `permission` at `target`. Owners may do everything in
 * their workspace; everyone else only what one of their roles grants there.
 */
export function can(access: AccessContext, permission: Permission, target: AccessTarget): boolean {
  const membership = access.memberships.find((m) => m.workspaceId === target.workspaceId)
  if (!membership) {
    return false
  }
  if (membership.isOwner) {
    return true
  }
  const { level, ownerOnly } = PERMISSIONS[permission]
  if (ownerOnly) {
    return false
  }
  const scope = scopeAtLevel(target.scope, level)
  return membership.assignments.some((assignment) => grants(assignment, permission, scope))
}

export function isMemberOf(access: AccessContext, workspaceId: string): boolean {
  return access.memberships.some((membership) => membership.workspaceId === workspaceId)
}

export function isOwnerOf(access: AccessContext, workspaceId: string): boolean {
  return access.memberships.some((membership) => membership.workspaceId === workspaceId && membership.isOwner)
}

/** The workspaces where the person holds `permission` across the whole workspace. */
export function workspaceIdsWith(access: AccessContext, permission: Permission): readonly string[] {
  return access.memberships
    .map((membership) => membership.workspaceId)
    .filter((workspaceId) => can(access, permission, { workspaceId, scope: { kind: 'workspace' } }))
}

/** The brand's markets where the person may use `permission`. "All markets" means exactly these. */
export function allowedMarketIds(
  access: AccessContext,
  permission: Permission,
  brand: BrandRef,
): readonly string[] {
  return brand.marketIds.filter((marketId) => can(access, permission, {
    workspaceId: brand.workspaceId,
    scope: { kind: 'market', brandId: brand.brandId, marketId },
  }))
}

/** Brand permissions held for the brand, plus market permissions held in at least one of its markets. */
export function brandPermissions(access: AccessContext, brand: BrandRef): readonly Permission[] {
  return BRAND_AND_MARKET_PERMISSIONS.filter((permission) => holdsInBrand(access, permission, brand))
}

function holdsInBrand(access: AccessContext, permission: Permission, brand: BrandRef): boolean {
  if (PERMISSIONS[permission].level === 'market') {
    return allowedMarketIds(access, permission, brand).length > 0
  }
  return can(access, permission, {
    workspaceId: brand.workspaceId,
    scope: { kind: 'brand', brandId: brand.brandId },
  })
}

// An assignment at a narrower scope can never cover the scope a higher-level
// permission is checked at, so this also keeps market roles away from brand totals.
function grants(assignment: Assignment, permission: Permission, scope: Scope): boolean {
  return assignment.permissions.includes(permission) && covers(assignment.scope, scope)
}
