'use client'

import { memo } from 'react'
import { alpha } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { BrandConfig } from '@/types'

const AVATAR_SIZE = 32
const ACCENT_BAR_WIDTH = 3
const TINT_DARK = 0.06
const TINT_LIGHT = 0.04
const GLYPH_TINT = 0.15
const EYEBROW_LABEL = 'Brand'

interface Props {
  readonly brand: BrandConfig
}

export default memo(function BrandHeader({ brand }: Props): JSX.Element {
  return (
    <Stack
      direction="row"
      spacing={3}
      alignItems="center"
      sx={(theme) => ({
        p: 3,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        borderLeft: `${ACCENT_BAR_WIDTH}px solid ${brand.color}`,
        backgroundColor:
          theme.palette.mode === 'dark'
            ? alpha(brand.color, TINT_DARK)
            : alpha(brand.color, TINT_LIGHT),
      })}
    >
      <Box
        sx={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: 2,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          lineHeight: 1,
          bgcolor: alpha(brand.color, GLYPH_TINT),
          color: brand.color,
        }}
      >
        {brand.emoji}
      </Box>
      <Stack spacing={0} sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          {EYEBROW_LABEL}
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, lineHeight: 1.3 }}
          noWrap
          title={brand.label}
        >
          {brand.label}
        </Typography>
      </Stack>
    </Stack>
  )
})
