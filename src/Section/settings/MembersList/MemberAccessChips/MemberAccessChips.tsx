'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import type { WorkspaceMemberView } from '@/types/workspace'
import { SETTINGS_LABELS } from '../../labels'
import { accessLabel } from './helpers'
import styles from './MemberAccessChips.module.css'

interface Props {
  readonly member: WorkspaceMemberView
}

export default memo(function MemberAccessChips({ member }: Props): JSX.Element {
  const hasNothing = !member.isOwner && member.access.length === 0

  return (
    <Box className={styles.root}>
      {member.isOwner && (
        <Chip size="small" color="primary" variant="outlined" label={SETTINGS_LABELS.members.owner} />
      )}
      {member.access.map((access) => (
        <Chip key={access.id} size="small" variant="outlined" label={accessLabel(access)} />
      ))}
      {hasNothing && (
        <Typography variant="body2" color="text.secondary">{SETTINGS_LABELS.members.noRoles}</Typography>
      )}
    </Box>
  )
})
