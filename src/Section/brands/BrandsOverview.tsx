'use client'

import { memo } from 'react'
import Link from 'next/link'
import { alpha } from '@mui/material/styles'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import type { BrandConfig } from '@/types'

interface Props {
  readonly brands: readonly BrandConfig[]
  readonly firstModuleId: string
}

export default memo(function BrandsOverview({ brands, firstModuleId }: Props): JSX.Element {
  return (
    <Box sx={{ p: { xs: 4, md: 6 } }}>
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
        Brands
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 6 }}>
        Select a brand to manage its modules.
      </Typography>

      <Grid container spacing={3}>
        {brands.map((brand) => (
          <Grid key={brand.id} item xs={12} sm={6} lg={4}>
            <BrandCard brand={brand} firstModuleId={firstModuleId} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
})

interface BrandCardProps {
  readonly brand: BrandConfig
  readonly firstModuleId: string
}

const BrandCard = memo(function BrandCard({ brand, firstModuleId }: BrandCardProps): JSX.Element {
  const href = `/brands/${brand.id}/${firstModuleId}`

  return (
    <Card
      elevation={0}
      sx={(theme) => ({
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderTop: `4px solid ${brand.color}`,
        border: `1px solid ${theme.palette.divider}`,
        borderTopColor: brand.color,
        borderRadius: 2,
        transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
        },
      })}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 5 }}>
        <Avatar
          sx={{
            width: 56,
            height: 56,
            bgcolor: alpha(brand.color, 0.12),
            color: brand.color,
            fontSize: 28,
            mb: 4,
          }}
        >
          {brand.emoji}
        </Avatar>

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          {brand.label}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, mb: 5 }}>
          {brand.description}
        </Typography>

        <Button
          component={Link}
          href={href}
          variant="contained"
          disableElevation
          sx={(theme) => ({
            bgcolor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark },
            alignSelf: 'flex-start',
            textTransform: 'none',
            fontWeight: 600,
          })}
        >
          Open Dashboard
        </Button>
      </CardContent>
    </Card>
  )
})
