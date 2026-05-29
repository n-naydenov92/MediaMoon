'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Switch from '@mui/material/Switch'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import SectionTitle from '../SectionTitle/SectionTitle'
import styles from './DynamicCreativeSection.module.css'

interface Props {
  readonly enabled: boolean
  readonly onChange: (next: boolean) => void
  readonly disabled: boolean
}

export default memo(function DynamicCreativeSection({
  enabled,
  onChange,
  disabled,
}: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <SectionTitle icon={<AutoAwesomeOutlinedIcon fontSize="inherit" />}>
        Dynamic creative
      </SectionTitle>

      <Box className={styles.row}>
        <Typography component="span" variant="inherit" className={styles.label}>
          Mix media and text variations
        </Typography>
        <Tooltip title={enabled ? 'On' : 'Off'} placement="top" disableInteractive>
          <Switch
            size="small"
            checked={enabled}
            onChange={(_, next) => onChange(next)}
            disabled={disabled}
            inputProps={{ 'aria-label': 'Dynamic creative' }}
          />
        </Tooltip>
      </Box>
    </Box>
  )
})
