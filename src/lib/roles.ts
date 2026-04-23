import type { UserRole } from '@/types'
import { ALL_ROLES } from '@/types'

/**
 * Extract a role from Clerk's sessionClaims / publicMetadata.
 * Accepts unknown and narrows to UserRole.
 */
export function parseRole(candidate: unknown): UserRole | null {
  if (typeof candidate !== 'string') {
    return null
  }
  const found = ALL_ROLES.find((r) => r === candidate)
  return found ?? null
}
