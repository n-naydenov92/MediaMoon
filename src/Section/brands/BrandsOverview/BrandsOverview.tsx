'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import type { BrandConfig } from '@/types'
import BrandCard from './BrandCard/BrandCard'
import styles from './BrandsOverview.module.css'

interface Props {
  readonly brands: readonly BrandConfig[]
}

export default memo(function BrandsOverview({ brands }: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <Typography variant="h5" component="h1" className={styles.title}>
        Brands
      </Typography>
      <Typography variant="body2" color="text.secondary" className={styles.intro}>
        Select a brand to manage its modules.
      </Typography>

      <Grid container spacing={2} className={styles.grid}>
        {brands.map((brand) => (
          <Grid key={brand.id} item xs={12} sm={6} lg={4}>
            <BrandCard brand={brand} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
})
