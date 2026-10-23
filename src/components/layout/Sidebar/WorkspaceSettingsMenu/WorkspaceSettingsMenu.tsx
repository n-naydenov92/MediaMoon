'use client'

import { memo, useCallback, useId, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import type { WorkspaceLink } from '@/types/workspace'
import { LABELS } from '@/components/layout/labels'
import { workspaceSettingsPath } from '@/lib/navigation'
import styles from './WorkspaceSettingsMenu.module.css'

interface Props {
  readonly workspaces: readonly WorkspaceLink[]
}

/**
 * Opens a workspace's settings: a direct link for one workspace, a menu of them for several.
 * A click-only menu, so it works the same in the mobile drawer.
 */
export default memo(function WorkspaceSettingsMenu({ workspaces }: Props): JSX.Element {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const menuId = useId()
  const open = useCallback((event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget), [])
  const close = useCallback(() => setAnchor(null), [])
  const [onlyWorkspace] = workspaces

  if (workspaces.length === 1 && onlyWorkspace) {
    return (
      <Button
        component={Link}
        href={workspaceSettingsPath(onlyWorkspace.slug, 'members')}
        className={styles.trigger}
        color="inherit"
        fullWidth
        startIcon={<SettingsOutlinedIcon />}
      >
        {LABELS.sidebar.workspaceSettings}
      </Button>
    )
  }

  return (
    <>
      <Button
        className={styles.trigger}
        color="inherit"
        fullWidth
        startIcon={<SettingsOutlinedIcon />}
        endIcon={<ChevronRightIcon />}
        aria-haspopup="menu"
        aria-controls={anchor ? menuId : undefined}
        aria-expanded={anchor !== null}
        onClick={open}
      >
        {LABELS.sidebar.workspaceSettings}
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={anchor !== null}
        onClose={close}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {workspaces.map((workspace) => (
          <MenuItem
            key={workspace.slug}
            component={Link}
            href={workspaceSettingsPath(workspace.slug, 'members')}
            onClick={close}
          >
            {workspace.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
})
