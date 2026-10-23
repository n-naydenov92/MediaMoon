import 'server-only'
import { getDb } from '@/lib/db/client'
import type { WorkspaceLink } from '@/types/workspace'
import type { Workspace } from '../../types'

// A deleted workspace is invisible until it is restored.
export async function readWorkspaceBySlug(slug: string): Promise<Workspace | null> {
  const row = await getDb().workspace.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      _count: { select: { brands: { where: { archivedAt: null } }, members: true } },
    },
  })
  if (!row) {
    return null
  }
  return { id: row.id, slug: row.slug, name: row.name, brandCount: row._count.brands, memberCount: row._count.members }
}

export async function readWorkspaceLinks(workspaceIds: readonly string[]): Promise<readonly WorkspaceLink[]> {
  if (workspaceIds.length === 0) {
    return []
  }
  return getDb().workspace.findMany({
    where: { id: { in: [...workspaceIds] }, deletedAt: null },
    select: { slug: true, name: true },
    orderBy: { name: 'asc' },
  })
}
