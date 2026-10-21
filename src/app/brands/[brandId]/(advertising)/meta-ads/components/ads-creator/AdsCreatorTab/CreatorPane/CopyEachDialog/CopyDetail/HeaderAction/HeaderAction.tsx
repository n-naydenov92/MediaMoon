import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import styles from './HeaderAction.module.css'

interface Props {
  readonly label: string
  readonly hint: string
  readonly icon: ReactNode
  readonly onClick: () => void
  readonly disabled?: boolean
  // Phone widths can't fit every label on the header line, so the action keeps only
  // its icon; the label moves to the aria-label.
  readonly iconOnly?: boolean
}

export default function HeaderAction({
  label,
  hint,
  icon,
  onClick,
  disabled = false,
  iconOnly = false,
}: Props): JSX.Element {
  // The span keeps the tooltip working while the button is disabled.
  return (
    <Tooltip title={hint} placement="top" disableInteractive>
      <Box component="span" className={styles.wrap}>
        {iconOnly ? (
          <IconButton size="small" color="inherit" aria-label={label} disabled={disabled} onClick={onClick}>
            {icon}
          </IconButton>
        ) : (
          <Button
            type="button"
            size="small"
            variant="text"
            color="inherit"
            startIcon={icon}
            disabled={disabled}
            onClick={onClick}
            className={styles.button}
          >
            {label}
          </Button>
        )}
      </Box>
    </Tooltip>
  )
}
