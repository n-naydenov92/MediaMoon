'use client'

import { memo } from 'react'
import Paper from '@mui/material/Paper'
import type { WorkspaceMemberView } from '@/types/workspace'
import MemberAccessChips from '../MemberAccessChips/MemberAccessChips'
import MemberIdentity from '../MemberIdentity/MemberIdentity'
import styles from './MemberCard.module.css'

interface Props {
  readonly member: WorkspaceMemberView
}

export default memo(function MemberCard({ member }: Props): JSX.Element {
  return (
    <Paper variant="outlined" className={styles.root}>
      <MemberIdentity member={member} />
      <MemberAccessChips member={member} />
    </Paper>
  )
})
