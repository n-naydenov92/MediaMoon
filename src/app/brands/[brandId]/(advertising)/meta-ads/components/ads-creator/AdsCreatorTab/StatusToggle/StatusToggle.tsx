'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Switch from '@mui/material/Switch'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import styles from './StatusToggle.module.css'

interface Props {
  readonly activate: boolean
  readonly onActivateChange: (next: boolean) => void
  readonly disabled: boolean
}

export default memo(function StatusToggle({
  activate,
  onActivateChange,
  disabled,
}: Props): JSX.Element {
  return (
    <Box className={styles.row}>
      <Typography component="span" variant="inherit" className={styles.label}>
        Active
      </Typography>
      <Tooltip title={activate ? 'On' : 'Off'} placement="top" disableInteractive>
        <Switch
          size="small"
          checked={activate}
          onChange={(_, next) => onActivateChange(next)}
          disabled={disabled}
          inputProps={{ 'aria-label': 'Active' }}
        />
      </Tooltip>
    </Box>
  )
})
