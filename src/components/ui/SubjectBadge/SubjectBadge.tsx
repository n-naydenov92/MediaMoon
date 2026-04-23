'use client'

import { memo } from 'react'
import Chip from '@mui/material/Chip'
import { LABELS } from '@/components/ui/labels'
import styles from './SubjectBadge.module.css'

const SUBJECT_STYLES: Record<string, { bg: string; fg: string }> = {
  stoichkov: { bg: 'rgba(59, 130, 246, 0.15)',  fg: '#3B82F6' },
  shtonova:  { bg: 'rgba(168, 85, 247, 0.15)',  fg: '#A855F7' },
}

const SUBJECT_LABELS: Record<string, string> = {
  stoichkov: LABELS.subjects.stoichkov,
  shtonova:  LABELS.subjects.shtonova,
}

interface Props {
  readonly tabId: string
}

/**
 * Subject-specific chip badge identifying which monitored person a news cluster belongs to.
 * Returns null when the tabId has no registered subject.
 */
export default memo(function SubjectBadge({ tabId }: Props): JSX.Element | null {
  const style = SUBJECT_STYLES[tabId]
  if (!style) {
    return null
  }
  return (
    <Chip
      size="small"
      label={SUBJECT_LABELS[tabId]}
      className={styles.badge}
      sx={{ backgroundColor: style.bg, color: style.fg }}
    />
  )
})
