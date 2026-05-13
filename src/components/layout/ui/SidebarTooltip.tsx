'use client'

import { memo, type ReactElement } from 'react'
import Tooltip from '@mui/material/Tooltip'
import { TOOLTIP_ENTER_DELAY_MS } from '@/lib/navigation'

interface Props {
  readonly label: string
  readonly enabled: boolean
  readonly children: ReactElement
}

/**
 * Shared sidebar tooltip configuration. Renders the child untouched when
 * `enabled === false` so the tooltip never wraps anything visible-by-default.
 */
const SidebarTooltip = memo(({
  label,
  enabled,
  children,
}: Props): ReactElement => {
  if (!enabled) {
    return children
  }
  return (
    <Tooltip
      title={label}
      placement="right"
      enterDelay={TOOLTIP_ENTER_DELAY_MS}
      disableInteractive
    >
      {children}
    </Tooltip>
  )
})

export default SidebarTooltip
