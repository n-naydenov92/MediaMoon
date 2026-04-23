'use client'

import { memo } from 'react'
import type { SvgIconProps } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import DashboardIcon from '@mui/icons-material/Dashboard'

/**
 * Icon name resolver for MODULE_REGISTRY.icon string.
 * Adding a new icon: register here, use the string name in modules.ts.
 */
const ICON_MAP: Record<string, React.ComponentType<SvgIconProps>> = {
  TrendingUp: TrendingUpIcon,
  LocalShipping: LocalShippingIcon,
  Dashboard: DashboardIcon,
}

interface Props {
  readonly name: string
  readonly size?: number
  readonly color?: string
}

export default memo(function ModuleIcon({ name, size = 20, color }: Props): JSX.Element {
  const Icon = ICON_MAP[name] ?? DashboardIcon
  return <Icon sx={{ fontSize: size, color }} />
})
