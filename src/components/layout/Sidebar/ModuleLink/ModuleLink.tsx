'use client'

import { memo } from 'react'
import Link from 'next/link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ModuleIcon from '@/components/layout/ModuleIcon/ModuleIcon'
import type { ModuleConfig } from '@/types'
import styles from './ModuleLink.module.css'

interface Props {
  readonly module: ModuleConfig
  readonly active: boolean
  readonly hrefOverride?: string
}

/**
 * Single sidebar navigation link for one registered module.
 * Renders with active state highlighting and a left accent border.
 */
export default memo(function ModuleLink({ module: mod, active, hrefOverride }: Props): JSX.Element {
  const href = hrefOverride ?? mod.path
  return (
    <Link href={href} className={styles.link} aria-current={active ? 'page' : undefined}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={3}
        sx={(theme) => ({
          px: 3,
          py: 2,
          borderRadius: 1,
          color: active ? 'text.primary' : 'text.secondary',
          backgroundColor: active ? 'action.selected' : 'transparent',
          borderLeft: `2px solid ${active ? mod.color : 'transparent'}`,
          transition: 'background-color 80ms ease-out',
          '&:hover': { backgroundColor: theme.palette.action.hover },
        })}
      >
        <ModuleIcon name={mod.icon} size={18} />
        <Typography variant="body2" sx={{ fontWeight: active ? 600 : 400 }}>
          {mod.label}
        </Typography>
      </Stack>
    </Link>
  )
})
