import { redirect } from 'next/navigation'
import { workspaceSettingsPath } from '@/lib/navigation'

interface Props {
  readonly params: Promise<{ readonly workspaceSlug: string }>
}

export default async function SettingsIndexPage({ params }: Props): Promise<never> {
  const { workspaceSlug } = await params
  redirect(workspaceSettingsPath(workspaceSlug, 'members'))
}
