'use client'

import { memo, useCallback, useId, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt'
import { useDismissPopover } from '@/components/layout/hooks/useDismissPopover'
import { useThemeMode } from '@/styles/useThemeMode'
import styles from './TopbarOverflowMenu.module.css'

const FEEDBACK_LABEL = 'Give Feedback'

export default memo(function TopbarOverflowMenu(): JSX.Element {
  const { mode } = useThemeMode()
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const menuId = useId()

  const dismiss = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleOpen = useCallback(() => {
    setIsOpen((s) => !s)
  }, [])

  const handleFeedback = useCallback(() => {
    setIsOpen(false)
  }, [])

  useDismissPopover(rootRef, isOpen, dismiss)

  return (
    <Box className={styles.root} ref={rootRef} data-theme={mode}>
      <Box
        component="button"
        type="button"
        className={styles.trigger}
        onClick={toggleOpen}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label="More actions"
      >
        <MoreHorizIcon fontSize="small" />
      </Box>
      {isOpen && (
        <Box component="ul" id={menuId} role="menu" className={styles.menu}>
          <Box component="li" role="none">
            <Box
              component="button"
              type="button"
              role="menuitem"
              className={styles.option}
              onClick={handleFeedback}
            >
              <Box component="span">{FEEDBACK_LABEL}</Box>
              <SentimentSatisfiedAltIcon className={styles.optionIcon} fontSize="small" />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
})
