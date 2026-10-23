import 'server-only'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { getWorkspaceBySlug, type Workspace } from '@/lib/tenancy'
import { can, isMemberOf } from '../can'
import type { Permission } from '../permissions'
import { getAccessContext } from './accessContext'

// Someone outside a workspace gets the same 404 as for one that doesn't exist, so a
// URL never reveals which workspaces exist.

export const requireWorkspaceMembership = cache(async (slug: string): Promise<Workspace> => {
  const [access, workspace] = await Promise.all([getAccessContext(), getWorkspaceBySlug(slug)])
  if (!workspace || !isMemberOf(access, workspace.id)) {
    notFound()
  }
  return workspace
})

export const requireWorkspacePermission = cache(
  async (slug: string, permission: Permission): Promise<Workspace> => {
    const [access, workspace] = await Promise.all([getAccessContext(), getWorkspaceBySlug(slug)])
    if (!workspace || !can(access, permission, { workspaceId: workspace.id, scope: { kind: 'workspace' } })) {
      notFound()
    }
    return workspace
  },
)
