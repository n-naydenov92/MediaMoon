import type { ReactNode } from 'react'
import { requireWorkspaceMembership } from '@/lib/access/server/requireWorkspace'

interface Props {
  readonly params: Promise<{ readonly workspaceSlug: string }>
  readonly children: ReactNode
}

// Only the workspace's members get past this; everyone else sees a 404 (ADR 0003).
export default async function WorkspaceLayout({ params, children }: Props): Promise<JSX.Element> {
  const { workspaceSlug } = await params
  await requireWorkspaceMembership(workspaceSlug)
  return <>{children}</>
}
