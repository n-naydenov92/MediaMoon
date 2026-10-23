import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import PageTopbar from '@/components/layout/PageTopbar/PageTopbar'
import { SETTINGS_LABELS } from '../labels'
import SettingsTabs from './SettingsTabs/SettingsTabs'
import styles from './SettingsShell.module.css'

interface Props {
  readonly workspaceName: string
  readonly workspaceSlug: string
  readonly children: ReactNode
}

export default function SettingsShell({ workspaceName, workspaceSlug, children }: Props): JSX.Element {
  return (
    <>
      <PageTopbar title={`${SETTINGS_LABELS.title} · ${workspaceName}`} />
      <Box className={styles.page}>
        <SettingsTabs workspaceSlug={workspaceSlug} />
        <Box className={styles.content}>{children}</Box>
      </Box>
    </>
  )
}
