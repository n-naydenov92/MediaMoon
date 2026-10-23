import { readWorkspaceMembers } from '@/lib/access/server/readMembers'
import { requireWorkspacePermission } from '@/lib/access/server/requireWorkspace'
import MembersList from '@/Section/settings/MembersList/MembersList'

interface Props {
  readonly params: Promise<{ readonly workspaceSlug: string }>
}

// Each page checks access itself: a layout's check doesn't guard a page on its own.
export default async function MembersPage({ params }: Props): Promise<JSX.Element> {
  const { workspaceSlug } = await params
  const workspace = await requireWorkspacePermission(workspaceSlug, 'members.view')
  const members = await readWorkspaceMembers(workspace.id)
  return <MembersList members={members} />
}
