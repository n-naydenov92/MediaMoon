import 'server-only'
import { getDb } from '@/lib/db/client'
import type { DevPersona } from '../devPersona'
import type { AccessContext } from '../types'

/** The one role with this name in a workspace the person owns; null when there isn't exactly one. */
export async function readDevPersona(access: AccessContext, roleName: string): Promise<DevPersona | null> {
  const ownedWorkspaceIds = access.memberships
    .filter((membership) => membership.isOwner)
    .map((membership) => membership.workspaceId)
  const [role, another] = await getDb().role.findMany({
    where: { name: roleName, workspaceId: { in: ownedWorkspaceIds } },
    select: { workspaceId: true, permissions: true },
    take: 2,
  })
  return role && !another ? role : null
}
