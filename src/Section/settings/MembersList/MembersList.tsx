'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import type { WorkspaceMemberView } from '@/types/workspace'
import { SETTINGS_LABELS } from '../labels'
import MemberCard from './MemberCard/MemberCard'
import MemberRow from './MemberRow/MemberRow'
import styles from './MembersList.module.css'

const LABELS = SETTINGS_LABELS.members

interface Props {
  readonly members: readonly WorkspaceMemberView[]
}

/** A table on desktop, cards below 1024px; the hidden one is display:none, so screen readers read one. */
export default memo(function MembersList({ members }: Props): JSX.Element {
  return (
    <Box component="section" className={styles.root}>
      <Box className={styles.header}>
        <Typography variant="h3" component="h2">{`${LABELS.heading} (${members.length})`}</Typography>
        <Typography variant="body2" color="text.secondary">{LABELS.note}</Typography>
      </Box>
      <Paper variant="outlined" className={styles.table}>
        <Table size="small" aria-label={LABELS.heading}>
          <TableHead>
            <TableRow>
              <TableCell>{LABELS.member}</TableCell>
              <TableCell>{LABELS.access}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member) => <MemberRow key={member.id} member={member} />)}
          </TableBody>
        </Table>
      </Paper>
      <Box className={styles.cards}>
        {members.map((member) => <MemberCard key={member.id} member={member} />)}
      </Box>
    </Box>
  )
})
