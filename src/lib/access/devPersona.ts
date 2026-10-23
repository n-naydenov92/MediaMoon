import type { AccessContext } from './types'

/** A custom role an owner wants to see the app as, on their own machine. */
export interface DevPersona {
  readonly workspaceId: string
  readonly permissions: readonly string[]
}

/** Only on a developer's machine: `next dev`, never a Vercel deployment. */
export function isDevPersonaAllowed(env: Readonly<Record<string, string | undefined>>): boolean {
  return env.NODE_ENV === 'development' && !env.VERCEL
}

/**
 * Narrows an owner to one custom role across that role's workspace, and nothing
 * elsewhere, to see the app as someone with the role sees it. An owner already holds
 * every permission there, so the result is never wider than their real access.
 * Anyone who doesn't own the workspace keeps their real access.
 */
export function applyDevPersona(access: AccessContext, persona: DevPersona): AccessContext {
  const ownsWorkspace = access.memberships.some(
    (membership) => membership.workspaceId === persona.workspaceId && membership.isOwner,
  )
  if (!ownsWorkspace) {
    return access
  }
  return {
    memberships: [{
      workspaceId: persona.workspaceId,
      isOwner: false,
      assignments: [{ permissions: persona.permissions, scope: { kind: 'workspace' } }],
    }],
  }
}
