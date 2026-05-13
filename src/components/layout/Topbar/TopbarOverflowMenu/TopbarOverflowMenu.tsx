'use client'

import { memo, useCallback, useId, useRef, useState } from 'react'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt'
import { useDismissPopover } from '@/components/layout/hooks/useDismissPopover'
import { useThemeMode } from '@/styles/useThemeMode'
import styles from './TopbarOverflowMenu.module.css'

const FEEDBACK_LABEL = 'Give Feedback'

const TopbarOverflowMenu = memo(function TopbarOverflowMenu(): JSX.Element {
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
    <div className={styles.root} ref={rootRef} data-theme={mode}>
      <button
        type="button"
        className={styles.trigger}
        onClick={toggleOpen}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label="More actions"
      >
        <MoreHorizIcon fontSize="small" />
      </button>
      {isOpen && (
        <ul id={menuId} role="menu" className={styles.menu}>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className={styles.option}
              onClick={handleFeedback}
            >
              <span>{FEEDBACK_LABEL}</span>
              <SentimentSatisfiedAltIcon className={styles.optionIcon} fontSize="small" />
            </button>
          </li>
        </ul>
      )}
    </div>
  )
})

export default TopbarOverflowMenu
