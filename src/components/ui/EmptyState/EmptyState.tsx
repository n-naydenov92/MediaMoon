'use client'

import { memo } from 'react'
import type { ReactNode } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import InboxIcon from '@mui/icons-material/InboxOutlined'

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
    <Stack alignItems="center" spacing={3} sx={{ py: 16, textAlign: 'center', color: 'text.secondary' }}>
      <InboxIcon sx={{ fontSize: 40, color: 'text.muted' }} />
      <Typography variant="h3" sx={{ color: 'text.primary' }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ maxWidth: 360 }}>
          {description}
        </Typography>
      )}
      {action}
    </Stack>
  )
})
