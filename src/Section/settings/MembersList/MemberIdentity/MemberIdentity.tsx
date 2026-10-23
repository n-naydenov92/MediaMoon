'use client'

import { memo } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { WorkspaceMemberView } from '@/types/workspace'
import { displayName, initialOf } from './helpers'
import styles from './MemberIdentity.module.css'

interface Props {
  readonly member: WorkspaceMemberView
}

export default memo(function MemberIdentity({ member }: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <Avatar src={member.imageUrl ?? undefined} alt="">{initialOf(member)}</Avatar>
      <Box className={styles.text}>
        <Typography variant="body1" noWrap>{displayName(member)}</Typography>
        {member.name && (
          <Typography variant="body2" color="text.secondary" noWrap>{member.email}</Typography>
        )}
      </Box>
    </Box>
  )
})
