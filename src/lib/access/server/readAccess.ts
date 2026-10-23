import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { getDb } from '@/lib/db/client'
import { toAccessContext } from '../toAccessContext'
import type { AccessContext } from '../types'

const MEMBERSHIPS = {
  select: {
    workspaceId: true,
    isOwner: true,
    workspace: { select: { deletedAt: true } },
    assignments: { select: { brandId: true, marketId: true, role: { select: { permissions: true } } } },
  },
} satisfies Prisma.User$membershipsArgs

export interface StoredAccess {
  readonly userId: string
  readonly access: AccessContext
}

/** One query for the person, their memberships and every role they were given. Null for someone not stored yet. */
export async function readAccess(clerkUserId: string): Promise<StoredAccess | null> {
  const user = await getDb().user.findUnique({
    where: { clerkUserId },
    select: { id: true, memberships: MEMBERSHIPS },
  })
  return user ? { userId: user.id, access: toAccessContext(user.memberships) } : null
}
