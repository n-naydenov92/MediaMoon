import type { ReactNode } from 'react'
import { requireWorkspacePermission } from '@/lib/access/server/requireWorkspace'
import SettingsShell from '@/Section/settings/SettingsShell/SettingsShell'

interface Props {
  readonly params: Promise<{ readonly workspaceSlug: string }>
  readonly children: ReactNode
}

export default async function SettingsLayout({ params, children }: Props): Promise<JSX.Element> {
  const { workspaceSlug } = await params
  const workspace = await requireWorkspacePermission(workspaceSlug, 'members.view')
  return (
    <SettingsShell workspaceName={workspace.name} workspaceSlug={workspace.slug}>
      {children}
    </SettingsShell>
  )
}
