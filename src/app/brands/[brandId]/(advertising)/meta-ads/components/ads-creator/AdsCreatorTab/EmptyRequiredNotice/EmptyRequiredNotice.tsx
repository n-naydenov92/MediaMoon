'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import type { EmptyRequiredCounts } from '../perCreativeCopy'
import styles from './EmptyRequiredNotice.module.css'

function clause(count: number, noun: string): string | null {
  if (count === 0) {
    return null
  }
  return `${count} ${count === 1 ? 'creative has' : 'creatives have'} an empty ${noun}`
}

interface Props {
  readonly counts: EmptyRequiredCounts
}

// Warns when one or more creatives would publish with a blank required field
// (primary text / headline). Renders nothing when every ad is covered.
export default memo(function EmptyRequiredNotice({ counts }: Props): JSX.Element | null {
  const parts = [clause(counts.primary, 'primary text'), clause(counts.headline, 'headline')]
    .filter((p): p is string => p !== null)
  if (parts.length === 0) {
    return null
  }
  return (
    <Box className={styles.root} role="alert">
      <WarningAmberOutlinedIcon className={styles.icon} fontSize="inherit" />
      <Typography component="span" variant="inherit" className={styles.text}>
        {`${parts.join(' · ')} — fix before publishing.`}
      </Typography>
    </Box>
  )
})
