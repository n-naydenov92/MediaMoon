'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import styles from './AvailableOnlyChip.module.css'

const HINT = 'Hide creatives you can’t add to the selected account'

interface Props {
  readonly checked: boolean
  readonly onChange: (next: boolean) => void
  // The host's chip class, so it matches the preset chips it sits next to.
  readonly className?: string
}

// A filter chip, not a choice chip: the check marks that it combines with the
// selected preset instead of replacing it.
export default memo(function AvailableOnlyChip({ checked, onChange, className }: Props): JSX.Element {
  const checkIcon = (
    <Box component="span" className={styles.checkIcon}>
      <CheckRoundedIcon fontSize="inherit" />
    </Box>
  )

  return (
    <Tooltip title={HINT} placement="top" disableInteractive>
      <Chip
        icon={checked ? checkIcon : undefined}
        label="Available only"
        clickable
        onClick={() => onChange(!checked)}
        variant={checked ? 'filled' : 'outlined'}
        color={checked ? 'primary' : 'default'}
        size="small"
        aria-pressed={checked}
        data-active={checked ? 'true' : 'false'}
        className={className}
      />
    </Tooltip>
  )
})
