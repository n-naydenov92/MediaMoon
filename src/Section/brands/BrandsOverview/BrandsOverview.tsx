'use client'

import { memo, useState } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import type { BrandConfig } from '@/types'
import DebouncedSearchInput from '@/components/ui/DebouncedSearchInput/DebouncedSearchInput'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import BrandCard from './BrandCard/BrandCard'
import { filterBrands } from './helpers'
import styles from './BrandsOverview.module.css'

interface Props {
  readonly brands: readonly BrandConfig[]
}

const BRANDS_SEARCH_THRESHOLD = 6

export default memo(function BrandsOverview({ brands }: Props): JSX.Element {
  const [query, setQuery] = useState('')

  const isSearchable = brands.length > BRANDS_SEARCH_THRESHOLD
  const visibleBrands = isSearchable ? filterBrands(brands, query) : brands

  return (
    <Box className={styles.root}>
      <Typography variant="h5" component="h1" className={styles.title}>
        Brands
      </Typography>
      <Typography variant="body2" color="text.secondary" className={styles.intro}>
        Select a brand to manage its modules.
      </Typography>

      {isSearchable && (
        <DebouncedSearchInput
          placeholder="Search brands…"
          onDebouncedChange={setQuery}
          className={styles.search}
        />
      )}

      {visibleBrands.length > 0 ? (
        <Grid container spacing={3}>
          {visibleBrands.map((brand) => (
            <Grid key={brand.id} item xs={12} sm={6} lg={4}>
              <BrandCard brand={brand} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <EmptyState
          title="No brands match your search"
          description="Try a different name or market."
        />
      )}
    </Box>
  )
})
