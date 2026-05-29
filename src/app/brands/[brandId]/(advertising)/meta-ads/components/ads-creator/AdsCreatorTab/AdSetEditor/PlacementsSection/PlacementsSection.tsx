'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import AdvantageBadge from '../AdvantageBadge/AdvantageBadge'
import SectionTitle from '../SectionTitle/SectionTitle'
import { PLACEMENT_CATALOG } from './catalog'
import styles from './PlacementsSection.module.css'

export default memo(function PlacementsSection(): JSX.Element {
  return (
    <Box className={styles.root}>
      <Box className={styles.titleRow}>
        <SectionTitle icon={<GridViewOutlinedIcon fontSize="inherit" />}>
          Placements
        </SectionTitle>
        <AdvantageBadge on />
      </Box>

      <Typography component="span" variant="inherit" className={styles.subtitle}>
        Meta auto-selects placements across all surfaces for best performance.
      </Typography>

      <Box className={styles.platformPills}>
        {PLACEMENT_CATALOG.map((p) => (
          <Box key={p.id} component="span" className={styles.platformPill}>
            {p.label}
          </Box>
        ))}
      </Box>
    </Box>
  )
})
