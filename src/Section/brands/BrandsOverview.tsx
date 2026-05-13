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
}

export default memo(({ brands }: Props): JSX.Element => (
  <Box sx={{ p: { xs: 2, md: 6 } }}>
    <Typography
      variant="h5"
      sx={{
        mb: 0.5,
        fontWeight: 700,
        fontSize: { xs: 20, md: 24 },
      }}
    >
      Brands
    </Typography>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: { xs: 3, md: 6 }, fontSize: { xs: 13, md: 14 } }}
    >
      Select a brand to manage its modules.
    </Typography>

    <Grid container spacing={{ xs: 2, md: 3 }}>
      {brands.map((brand) => (
        <Grid key={brand.id} item xs={12} sm={6} lg={4}>
          {/* eslint-disable-next-line @typescript-eslint/no-use-before-define -- function defined later in file */}
          <BrandCard brand={brand} />
        </Grid>
      ))}
    </Grid>
  </Box>
))

interface BrandCardProps {
  readonly brand: BrandConfig
}

const BrandCard = memo(({ brand }: BrandCardProps): JSX.Element => {
  const href = `/brands/${brand.id}`

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
      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 2, md: 5 },
          '&:last-child': { pb: { xs: 2, md: 5 } },
        }}
      >
        <Avatar
          sx={{
            width: { xs: 40, md: 56 },
            height: { xs: 40, md: 56 },
            bgcolor: alpha(brand.color, 0.12),
            color: brand.color,
            fontSize: { xs: 20, md: 28 },
            mb: { xs: 1.5, md: 4 },
          }}
        >
          {brand.emoji}
        </Avatar>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 0.5,
            fontSize: { xs: 16, md: 20 },
            lineHeight: 1.3,
          }}
        >
          {brand.label}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            flex: 1,
            mb: { xs: 2, md: 5 },
            fontSize: { xs: 13, md: 14 },
          }}
        >
          {brand.description}
        </Typography>

        <Button
          component={Link}
          href={href}
          variant="contained"
          disableElevation
          size="small"
          sx={(theme) => ({
            bgcolor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark },
            alignSelf: 'flex-start',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: 13, md: 14 },
            px: { xs: 1.5, md: 2 },
            py: { xs: 0.75, md: 1 },
          })}
        >
          Open Dashboard
        </Button>
      </CardContent>
    </Card>
  )
})
