import type { PermissionLevel } from './types'

interface PermissionDefinition {
  readonly level: PermissionLevel
  /** Held only by owners and never part of a role, so nobody can hand it out. */
  readonly ownerOnly?: boolean
}

const DEFINITIONS = {
  'workspace.delete': { level: 'workspace', ownerOnly: true },
  'billing.manage': { level: 'workspace', ownerOnly: true },
  'owners.manage': { level: 'workspace', ownerOnly: true },
  'workspace.manage': { level: 'workspace' },
  'roles.manage': { level: 'workspace' },
  'members.view': { level: 'workspace' },
  'members.manage': { level: 'workspace' },
  'brand.manage': { level: 'brand' },
  'dashboard.view': { level: 'brand' },
  'google-ads.view': { level: 'market' },
  'meta-ads.overview.view': { level: 'market' },
  'meta-ads.performance.view': { level: 'market' },
  'meta-ads.creator.use': { level: 'market' },
  'meta-ads.creator.publish': { level: 'market' },
  'meta-ads.creator.activate': { level: 'market' },
} satisfies Record<string, PermissionDefinition>

export type Permission = keyof typeof DEFINITIONS

/** The permission catalog. Roles are built from it; the database stores only the keys. */
export const PERMISSIONS: Readonly<Record<Permission, PermissionDefinition>> = DEFINITIONS

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as readonly Permission[]

export function isPermission(value: string): value is Permission {
  return Object.hasOwn(PERMISSIONS, value)
}
