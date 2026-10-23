import 'server-only'
import { auth } from '@clerk/nextjs/server'
import { cache } from 'react'
import { applyDevPersona, isDevPersonaAllowed } from '../devPersona'
import type { AccessContext } from '../types'
import { ensureUser } from './ensureUser'
import { readAccess } from './readAccess'
import { readDevPersona } from './readDevPersona'

const NO_ACCESS: AccessContext = { memberships: [] }

/**
 * What the signed-in person may do (ADR 0003). Server components of one request share a
 * single read through cache(); a route handler should call it once and pass it on.
 * Someone signed out, or seen for the first time, gets no access.
 */
export const getAccessContext = cache(async (): Promise<AccessContext> => {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) {
    return NO_ACCESS
  }
  const stored = await readAccess(clerkUserId)
  if (!stored) {
    await ensureUser(clerkUserId)
    return NO_ACCESS
  }
  return withDevPersona(stored.access)
})

// ACCESS_DEV_ROLE=<role name> lets an owner see the app as that role, locally only.
async function withDevPersona(access: AccessContext): Promise<AccessContext> {
  const roleName = process.env.ACCESS_DEV_ROLE
  if (!roleName || !isDevPersonaAllowed(process.env)) {
    return access
  }
  const persona = await readDevPersona(access, roleName)
  // eslint-disable-next-line no-console
  console.warn('[access-dev-persona]', persona ? `acting as role "${roleName}"` : `no single role "${roleName}" in a workspace you own; real access kept`)
  return persona ? applyDevPersona(access, persona) : access
}
