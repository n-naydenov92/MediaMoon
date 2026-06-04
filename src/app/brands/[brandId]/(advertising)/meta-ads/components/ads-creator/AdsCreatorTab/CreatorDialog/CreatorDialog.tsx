'use client'

import { memo, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import CloseIcon from '@mui/icons-material/Close'
import styles from './CreatorDialog.module.css'

type DialogWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly icon: ReactNode
  readonly title: string
  readonly titleId: string
  readonly count?: ReactNode
  readonly maxWidth: DialogWidth
  readonly fullScreenBelow?: number
  readonly paperClassName?: string
  readonly footer?: ReactNode
  readonly children: ReactNode
}

// Shared chrome for every Ads Creator dialog: paper, header (icon · title ·
// count · close) and an optional white footer slot. Each dialog supplies only its
// own body and footer actions, so the four dialogs stay identical by construction.
export default memo(function CreatorDialog({
  open,
  onClose,
  icon,
  title,
  titleId,
  count,
  maxWidth,
  fullScreenBelow = 600,
  paperClassName,
  footer,
  children,
}: Props): JSX.Element {
  const fullScreen = useMediaQuery(`(max-width:${fullScreenBelow}px)`)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth={maxWidth}
      fullWidth
      aria-labelledby={titleId}
      classes={{ paper: paperClassName ? `${styles.paper} ${paperClassName}` : styles.paper }}
    >
      <Box component="header" className={styles.header}>
        <Box className={styles.headerTitleWrap}>
          <Box component="span" className={styles.headerIcon}>
            {icon}
          </Box>
          <Typography id={titleId} component="h2" variant="inherit" className={styles.headerTitle}>
            {title}
          </Typography>
          {count != null && (
            <Typography component="span" variant="inherit" className={styles.headerCount}>
              {count}
            </Typography>
          )}
        </Box>
        <IconButton aria-label="Close" onClick={onClose} className={styles.closeButton}>
          <CloseIcon />
        </IconButton>
      </Box>

      {children}

      {footer != null && (
        <Box component="footer" className={styles.footer}>
          {footer}
        </Box>
      )}
    </Dialog>
  )
})
