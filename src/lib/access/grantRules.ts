import { can } from './can'
import { PERMISSIONS, isPermission, type Permission } from './permissions'
import { carriesLevel } from './scope'
import type { AccessContext, AccessTarget, Scope } from './types'

export type RoleRuleViolation =
  | 'not-allowed'
  | 'unknown-permission'
  | 'owner-only-permission'
  | 'exceeds-own-access'

export type RoleRuleResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: RoleRuleViolation }

const ALLOWED: RoleRuleResult = { ok: true }

/**
 * Whether the person may create a role with these permissions, or save a role with
 * them. Editing checks both the role's current and its new permissions, so nobody
 * can touch a role stronger than their own access.
 */
export function checkRolePermissions(
  access: AccessContext,
  workspaceId: string,
  permissions: readonly string[],
): RoleRuleResult {
  const workspace: AccessTarget = { workspaceId, scope: { kind: 'workspace' } }
  if (!can(access, 'roles.manage', workspace)) {
    return refuse('not-allowed')
  }
  if (!permissions.every(isPermission)) {
    return refuse('unknown-permission')
  }
  if (permissions.some((permission) => PERMISSIONS[permission].ownerOnly)) {
    return refuse('owner-only-permission')
  }
  return heldAt(access, permissions, workspace)
}

/**
 * Whether the person may give a role with these permissions at `target`. Only the
 * permissions that take effect at that scope count. Taking a role away follows the
 * same rule, so nobody can strip access they couldn't have given.
 */
export function checkRoleGrant(
  access: AccessContext,
  target: AccessTarget,
  rolePermissions: readonly string[],
): RoleRuleResult {
  const workspace: AccessTarget = { workspaceId: target.workspaceId, scope: { kind: 'workspace' } }
  if (!can(access, 'members.manage', workspace)) {
    return refuse('not-allowed')
  }
  return heldAt(access, effectivePermissions(rolePermissions, target.scope), target)
}

/**
 * The role permissions that do something when the role is given at `scope`.
 * Unknown and owner-only keys never do; nor do workspace permissions given at a
 * brand or market, or brand permissions given at a market.
 */
export function effectivePermissions(permissions: readonly string[], scope: Scope): readonly Permission[] {
  return permissions.filter(isPermission).filter((permission) => {
    const { level, ownerOnly } = PERMISSIONS[permission]
    return !ownerOnly && carriesLevel(scope, level)
  })
}

/** Whether removing `userId` from the owners still leaves the workspace an owner. */
export function leavesAnOwner(ownerUserIds: readonly string[], userId: string): boolean {
  return ownerUserIds.some((ownerUserId) => ownerUserId !== userId)
}

function heldAt(
  access: AccessContext,
  permissions: readonly Permission[],
  target: AccessTarget,
): RoleRuleResult {
  const holdsAll = permissions.every((permission) => can(access, permission, target))
  return holdsAll ? ALLOWED : refuse('exceeds-own-access')
}

function refuse(reason: RoleRuleViolation): RoleRuleResult {
  return { ok: false, reason }
}
