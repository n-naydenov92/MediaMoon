'use client'

import { memo } from 'react'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Popper from '@mui/material/Popper'
import useMediaQuery from '@mui/material/useMediaQuery'
import CloseIcon from '@mui/icons-material/Close'
import { useThemeMode } from '@/styles/useThemeMode'
import CardContent from '../CardContent/CardContent'
import CardEmpty from '../CardEmpty/CardEmpty'
import CardError from '../CardError/CardError'
import CardSkeleton from '../CardSkeleton/CardSkeleton'
import type { CreativePreviewState } from '../creativePreviewTypes'
import styles from './CreativePreviewCard.module.css'

const POPPER_Z_INDEX = 1300
const MOBILE_QUERY = '(max-width: 1023px)'

const POPPER_MODIFIERS = [
  { name: 'offset', options: { offset: [0, 12] } },
  { name: 'preventOverflow', options: { padding: 16 } },
  { name: 'flip', options: { fallbackPlacements: ['left', 'top', 'bottom'] } },
]

interface Props {
  readonly anchor: HTMLElement | null
  readonly state: CreativePreviewState
  readonly onPointerEnter: () => void
  readonly onPointerLeave: () => void
  readonly onClose: () => void
}

const CreativePreviewCard = memo(function CreativePreviewCard({
  anchor,
  state,
  onPointerEnter,
  onPointerLeave,
  onClose,
}: Props): JSX.Element | null {
  const { mode } = useThemeMode()
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const isOpen = anchor !== null && state.status !== 'idle'

  if (isMobile) {
    return (
      <Dialog
        fullScreen
        open={isOpen}
        onClose={onClose}
        PaperProps={{ className: styles.sheet, 'data-theme': mode }}
      >
        <div className={styles.sheetHeader}>
          <IconButton
            size="small"
            aria-label="Close preview"
            onClick={onClose}
            className={styles.sheetClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
        <div className={styles.sheetContent} role="dialog">
          {renderState(state)}
        </div>
      </Dialog>
    )
  }

  if (!isOpen) {
    return null
  }

  return (
    <Popper
      open
      anchorEl={anchor}
      placement="right-start"
      modifiers={POPPER_MODIFIERS}
      style={{ zIndex: POPPER_Z_INDEX }}
    >
      <div
        className={styles.card}
        data-theme={mode}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        role="dialog"
      >
        {renderState(state)}
      </div>
    </Popper>
  )
})

function renderState(state: CreativePreviewState): JSX.Element | null {
  switch (state.status) {
    case 'loading':
      return <CardSkeleton />
    case 'error':
      return <CardError message={state.message} />
    case 'success':
      return <CardContent data={state.data} />
    case 'no-content':
      return <CardEmpty data={state.data} />
    case 'idle':
      return null
  }
}

export default CreativePreviewCard
