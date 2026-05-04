'use client'

import { memo } from 'react'
import Popper from '@mui/material/Popper'
import { useThemeMode } from '@/styles/useThemeMode'
import CardContent from './CardContent'
import CardEmpty from './CardEmpty'
import CardError from './CardError'
import CardSkeleton from './CardSkeleton'
import type { CreativePreviewState } from './creativePreviewTypes'
import styles from './CreativePreviewCard.module.css'

const POPPER_Z_INDEX = 1300

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
}

const CreativePreviewCard = memo(function CreativePreviewCard({
  anchor,
  state,
  onPointerEnter,
  onPointerLeave,
}: Props): JSX.Element | null {
  const { mode } = useThemeMode()
  if (!anchor || state.status === 'idle') {
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
