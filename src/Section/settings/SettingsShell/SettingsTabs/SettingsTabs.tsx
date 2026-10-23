'use client'

import { memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { workspaceSettingsPath, type SettingsTab } from '@/lib/navigation'
import { SETTINGS_LABELS } from '../../labels'

const TABS: readonly { readonly tab: SettingsTab; readonly label: string }[] = [
  { tab: 'members', label: SETTINGS_LABELS.tabs.members },
  { tab: 'general', label: SETTINGS_LABELS.tabs.general },
]

interface Props {
  readonly workspaceSlug: string
}

export default memo(function SettingsTabs({ workspaceSlug }: Props): JSX.Element {
  const pathname = usePathname()
  const active = TABS.find(({ tab }) => pathname === workspaceSettingsPath(workspaceSlug, tab))?.tab ?? false

  return (
    <Tabs value={active} variant="scrollable" scrollButtons={false} aria-label={SETTINGS_LABELS.title}>
      {TABS.map(({ tab, label }) => (
        <Tab key={tab} value={tab} label={label} component={Link} href={workspaceSettingsPath(workspaceSlug, tab)} />
      ))}
    </Tabs>
  )
})
