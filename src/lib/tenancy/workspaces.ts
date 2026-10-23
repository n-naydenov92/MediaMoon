import 'server-only'
import { cache } from 'react'
import type { WorkspaceLink } from '@/types/workspace'
import { readWorkspaceBySlug, readWorkspaceLinks } from './source/db/workspaces'
import type { Workspace } from './types'

export const getWorkspaceBySlug = cache(
  async (slug: string): Promise<Workspace | null> => readWorkspaceBySlug(slug),
)

// Not wrapped in cache(): it compares arguments by identity, so a fresh id array never hits.
export async function listWorkspaceLinks(workspaceIds: readonly string[]): Promise<readonly WorkspaceLink[]> {
  return readWorkspaceLinks(workspaceIds)
}
