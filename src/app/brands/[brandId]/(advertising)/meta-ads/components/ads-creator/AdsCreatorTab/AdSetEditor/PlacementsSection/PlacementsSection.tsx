'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import type { PlacementSelection } from '@/lib/gateways/MetaAdsGateway'
import AdvantageBadge from '../AdvantageBadge/AdvantageBadge'
import SectionTitle from '../SectionTitle/SectionTitle'
import { isAdvantagePlus, placementsSubtitle, visiblePlatforms } from './helpers'
import styles from './PlacementsSection.module.css'

interface Props {
  // null = nothing to copy (create mode): the new ad set gets Advantage+ placements.
  readonly sourcePlacements: PlacementSelection | null
}

export default memo(function PlacementsSection({ sourcePlacements }: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <Box className={styles.titleRow}>
        <SectionTitle icon={<GridViewOutlinedIcon fontSize="inherit" />}>
          Placements
        </SectionTitle>
        <AdvantageBadge on={isAdvantagePlus(sourcePlacements)} />
      </Box>

      <Typography component="span" variant="inherit" className={styles.subtitle}>
        {placementsSubtitle(sourcePlacements)}
      </Typography>

      <Box className={styles.platformPills}>
        {visiblePlatforms(sourcePlacements).map((p) => (
          <Box key={p.id} component="span" className={styles.platformPill}>
            {p.label}
          </Box>
        ))}
      </Box>
    </Box>
  )
})
