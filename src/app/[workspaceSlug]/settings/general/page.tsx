import { isOwnerOf } from '@/lib/access/can'
import { getAccessContext } from '@/lib/access/server/accessContext'
import { requireWorkspacePermission } from '@/lib/access/server/requireWorkspace'
import WorkspaceGeneral from '@/Section/settings/WorkspaceGeneral/WorkspaceGeneral'

interface Props {
  readonly params: Promise<{ readonly workspaceSlug: string }>
}

export default async function GeneralSettingsPage({ params }: Props): Promise<JSX.Element> {
  const { workspaceSlug } = await params
  const [workspace, access] = await Promise.all([
    requireWorkspacePermission(workspaceSlug, 'members.view'),
    getAccessContext(),
  ])
  return (
    <WorkspaceGeneral
      name={workspace.name}
      slug={workspace.slug}
      brandCount={workspace.brandCount}
      memberCount={workspace.memberCount}
      isOwner={isOwnerOf(access, workspace.id)}
    />
  )
}
