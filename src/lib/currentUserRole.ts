import { auth, currentUser } from '@clerk/nextjs/server'
import type { UserRole } from '@/types'
import { parseRole } from '@/lib/roles'

/**
 * Server-side role resolution. Reads from session claims first,
 * falls back to Clerk User publicMetadata. Returns null if not signed in
 * or no valid role assigned.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const session = await auth()
  if (!session.userId) {
    return null
  }

  const fromClaims = parseRole(session.sessionClaims?.role)
  if (fromClaims) {
    return fromClaims
  }

  const user = await currentUser()
  if (!user) {
    return null
  }
  return parseRole(user.publicMetadata.role)
}
