'use client'

import { memo } from 'react'
import type { SvgIconProps } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import DashboardIcon from '@mui/icons-material/Dashboard'
import CampaignIcon from '@mui/icons-material/Campaign'
import FacebookIcon from '@mui/icons-material/Facebook'
import GoogleIcon from '@mui/icons-material/Google'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard'
import BarChartIcon from '@mui/icons-material/BarChart'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import LightbulbIcon from '@mui/icons-material/LightbulbOutlined'
import { cssVars } from '@/lib/css'
import styles from './ModuleIcon.module.css'

const ICON_MAP = {
  TrendingUp: TrendingUpIcon,
  LocalShipping: LocalShippingIcon,
  Dashboard: DashboardIcon,
  Campaign: CampaignIcon,
  Facebook: FacebookIcon,
  Google: GoogleIcon,
  MusicNote: MusicNoteIcon,
  SpaceDashboard: SpaceDashboardIcon,
  BarChart: BarChartIcon,
  AddCircleOutline: AddCircleOutlineIcon,
  Lightbulb: LightbulbIcon,
} as const satisfies Record<string, React.ComponentType<SvgIconProps>>

const DEFAULT_ICON_SIZE_PX = 20

interface Props {
  readonly name: string
  readonly size?: number
  readonly color?: string
}

export default memo(function ModuleIcon({
  name,
  size = DEFAULT_ICON_SIZE_PX,
  color,
}: Props): JSX.Element {
  const Icon = (ICON_MAP as Record<string, React.ComponentType<SvgIconProps>>)[name] ?? DashboardIcon

  const vars: Record<`--${string}`, string> = { '--icon-size': `${size}px` }
  if (color) {
    vars['--icon-color'] = color
  }

  return (
    <span className={styles.root} style={cssVars(vars)} aria-hidden="true">
      <Icon className={styles.icon} />
    </span>
  )
})
