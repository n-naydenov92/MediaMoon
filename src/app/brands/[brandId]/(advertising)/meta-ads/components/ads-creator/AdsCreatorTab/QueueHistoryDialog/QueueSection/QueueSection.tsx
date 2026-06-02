'use client'

import { memo, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { LaunchJob } from '../../useLaunchQueue'
import QueueRow from '../../QueueRow/QueueRow'
import styles from './QueueSection.module.css'

export interface SectionBulkAction {
  readonly label: string
  readonly icon: ReactNode
  readonly onClick: () => void
}

interface Props {
  readonly title: string
  readonly jobs: readonly LaunchJob[]
  readonly collapsed: boolean
  readonly onToggle: () => void
  readonly accountId: string
  readonly onRetry: (jobId: string) => void
  readonly onStop: (jobId: string) => void
  readonly onDismiss: (jobId: string) => void
  readonly bulkAction?: SectionBulkAction
}

export default memo(function QueueSection({
  title,
  jobs,
  collapsed,
  onToggle,
  accountId,
  onRetry,
  onStop,
  onDismiss,
  bulkAction,
}: Props): JSX.Element | null {
  if (jobs.length === 0) {
    return null
  }

  return (
    <Box className={styles.section}>
      <Box className={styles.header}>
        <Button
          type="button"
          color="inherit"
          className={styles.toggle}
          onClick={onToggle}
          aria-expanded={!collapsed}
        >
          <ExpandMoreIcon className={styles.chevron} data-collapsed={collapsed ? 'true' : 'false'} fontSize="inherit" />
          <Typography component="span" variant="inherit" className={styles.title}>
            {title}
          </Typography>
          <Typography component="span" variant="inherit" className={styles.count}>
            {jobs.length}
          </Typography>
        </Button>
        <Box className={styles.headerLine} aria-hidden />
        {bulkAction && (
          <Button
            type="button"
            size="small"
            variant="text"
            color="inherit"
            className={styles.bulkButton}
            startIcon={bulkAction.icon}
            onClick={bulkAction.onClick}
          >
            {bulkAction.label}
          </Button>
        )}
      </Box>

      <Collapse in={!collapsed} timeout={200} unmountOnExit>
        <Box className={styles.columns} aria-hidden>
          <Box component="span" />
          <Typography component="span" variant="inherit" className={styles.col}>Name</Typography>
          <Typography component="span" variant="inherit" className={styles.col}>Type</Typography>
          <Typography component="span" variant="inherit" className={styles.col}>Status</Typography>
          <Typography component="span" variant="inherit" className={`${styles.col} ${styles.colCenter}`}>Open</Typography>
          <Typography component="span" variant="inherit" className={`${styles.col} ${styles.colCenter}`}>Actions</Typography>
        </Box>
        <Box className={styles.rows}>
          {jobs.map((job) => (
            <QueueRow
              key={job.id}
              job={job}
              accountId={accountId}
              onRetry={onRetry}
              onStop={onStop}
              onDismiss={onDismiss}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  )
})
