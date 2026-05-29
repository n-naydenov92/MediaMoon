'use client'

import { memo, useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import styles from './AccordionToggle.module.css'

interface Props {
  readonly closedLabel: ReactNode
  readonly openLabel?: ReactNode
  readonly summary?: ReactNode
  readonly disabled?: boolean
  readonly children: ReactNode
}

export default memo(function AccordionToggle({
  closedLabel,
  openLabel,
  summary,
  disabled = false,
  children,
}: Props): JSX.Element {
  const [open, setOpen] = useState<boolean>(false)
  const label = open ? (openLabel ?? closedLabel) : closedLabel

  return (
    <Box className={styles.root}>
      <Box
        component="button"
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        aria-expanded={open}
      >
        <Typography component="span" variant="inherit" className={styles.title}>
          {label}
        </Typography>
        <ExpandMoreOutlinedIcon
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          fontSize="small"
        />
        {summary !== undefined && !open && (
          <Typography component="span" variant="inherit" className={styles.summary}>
            {summary}
          </Typography>
        )}
      </Box>

      <Collapse in={open} timeout={200} unmountOnExit>
        {children}
      </Collapse>
    </Box>
  )
})
