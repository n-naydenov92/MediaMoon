'use client'

import { memo } from 'react'
import type { ReactNode } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import InboxIcon from '@mui/icons-material/InboxOutlined'
import styles from './EmptyState.module.css'

interface Props {
  readonly title: string
  readonly description?: string
  readonly action?: ReactNode
}

/**
 * Empty content placeholder with icon, heading, optional description, and CTA slot.
 */
export default memo(function EmptyState({ title, description, action }: Props): JSX.Element {
  return (
    <Stack alignItems="center" spacing={3} className={styles.root}>
      <InboxIcon className={styles.icon} fontSize="inherit" />
      <Typography variant="h3" color="text.primary">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" className={styles.description}>
          {description}
        </Typography>
      )}
      {action}
    </Stack>
  )
})
