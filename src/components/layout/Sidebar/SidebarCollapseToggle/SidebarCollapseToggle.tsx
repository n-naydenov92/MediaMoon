'use client'

import { memo } from 'react'
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import { LABELS } from '@/components/layout/labels'
import SidebarTooltip from '@/components/layout/ui/SidebarTooltip'
import styles from './SidebarCollapseToggle.module.css'

interface Props {
  readonly isCollapsed: boolean
  readonly onToggle: () => void
}

const SidebarCollapseToggle = memo(function SidebarCollapseToggle({
  isCollapsed,
  onToggle,
}: Props): JSX.Element {
  const ariaLabel = isCollapsed
    ? LABELS.sidebar.expandAction
    : LABELS.sidebar.collapseAction

  return (
    <SidebarTooltip label={ariaLabel} enabled>
      <button
        type="button"
        className={styles.root}
        data-collapsed={isCollapsed ? 'true' : 'false'}
        onClick={onToggle}
        aria-label={ariaLabel}
      >
        {isCollapsed ? (
          <KeyboardDoubleArrowRightIcon fontSize="small" />
        ) : (
          <KeyboardDoubleArrowLeftIcon fontSize="small" />
        )}
      </button>
    </SidebarTooltip>
  )
})

export default SidebarCollapseToggle
