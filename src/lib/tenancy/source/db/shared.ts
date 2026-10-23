import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { isAllowedSecretEnvVar } from '../../secretEnvVars'

// Archived brands and the brands of deleted workspaces are invisible to the app.
export const ACTIVE_BRAND = {
  archivedAt: null,
  workspace: { deletedAt: null },
} satisfies Prisma.BrandWhereInput

// Rows were created in the order they had in config, so lists keep today's order
// (it matters where code takes the first account of a connection).
export const BY_CREATION = [{ createdAt: 'asc' }, { id: 'asc' }] satisfies Prisma.BrandOrderByWithRelationInput[]

export function jsonString(json: Prisma.JsonValue, key: string): string | null {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    return null
  }
  const value = json[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

// Only allowlisted names come back, so a stored name can never point the app at an
// unrelated secret such as CLERK_SECRET_KEY.
export function secretEnvVar(secretEnvVars: Prisma.JsonValue, role: string): string | null {
  const name = jsonString(secretEnvVars, role)
  return name && isAllowedSecretEnvVar(name) ? name : null
}
