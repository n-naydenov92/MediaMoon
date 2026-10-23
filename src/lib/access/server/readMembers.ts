import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { getDb } from '@/lib/db/client'
import type { MemberAccess, MemberAccessPlace, WorkspaceMemberView } from '@/types/workspace'

const MEMBER = {
  id: true,
  isOwner: true,
  user: { select: { name: true, email: true, imageUrl: true } },
  assignments: {
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      role: { select: { name: true } },
      brand: { select: { name: true } },
      market: { select: { code: true } },
    },
  },
} satisfies Prisma.WorkspaceMemberSelect

type MemberRow = Prisma.WorkspaceMemberGetPayload<{ select: typeof MEMBER }>
type AssignmentRow = MemberRow['assignments'][number]

/** A workspace's members, owners first, with every role they were given and where. Callers check access first. */
export async function readWorkspaceMembers(workspaceId: string): Promise<readonly WorkspaceMemberView[]> {
  const rows = await getDb().workspaceMember.findMany({
    where: { workspaceId },
    select: MEMBER,
    orderBy: [{ isOwner: 'desc' }, { createdAt: 'asc' }],
  })
  return rows.map(toMemberView)
}

function toMemberView(row: MemberRow): WorkspaceMemberView {
  return {
    id: row.id,
    name: row.user.name,
    email: row.user.email,
    imageUrl: row.user.imageUrl,
    isOwner: row.isOwner,
    access: row.assignments.map(toMemberAccess),
  }
}

function toMemberAccess(row: AssignmentRow): MemberAccess {
  return { id: row.id, roleName: row.role.name, place: toPlace(row) }
}

function toPlace({ brand, market }: AssignmentRow): MemberAccessPlace {
  if (brand && market) {
    return { kind: 'market', brandName: brand.name, marketCode: market.code }
  }
  return brand ? { kind: 'brand', brandName: brand.name } : { kind: 'workspace' }
}
