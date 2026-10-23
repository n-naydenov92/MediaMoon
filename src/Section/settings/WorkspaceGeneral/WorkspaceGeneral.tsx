'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { SETTINGS_LABELS } from '../labels'
import styles from './WorkspaceGeneral.module.css'

const LABELS = SETTINGS_LABELS.general

interface Props {
  readonly name: string
  readonly slug: string
  readonly brandCount: number
  readonly memberCount: number
  readonly isOwner: boolean
}

export default memo(function WorkspaceGeneral({ name, slug, brandCount, memberCount, isOwner }: Props): JSX.Element {
  const rows = [
    { label: LABELS.name, value: name },
    { label: LABELS.address, value: `/${slug}` },
    { label: LABELS.brands, value: String(brandCount) },
    { label: LABELS.members, value: String(memberCount) },
    { label: LABELS.yourAccess, value: isOwner ? LABELS.owner : LABELS.member },
  ]

  return (
    <Paper variant="outlined" className={styles.card}>
      <Box component="dl" className={styles.list}>
        {rows.map(({ label, value }) => (
          <Box key={label} className={styles.row}>
            <Typography component="dt" variant="caption" color="text.secondary">{label}</Typography>
            <Typography component="dd" variant="body1" className={styles.value}>{value}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
})
