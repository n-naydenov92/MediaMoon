'use client'

import { memo, type CSSProperties } from 'react'
import Link from 'next/link'
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardRounded'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import type { BrandConfig } from '@/types'
import styles from './BrandCard.module.css'

interface Props {
  readonly brand: BrandConfig
}

export default memo(function BrandCard({ brand }: Props): JSX.Element {
  const cssVars = { '--brand-color': brand.color } as CSSProperties

  return (
    <Card
      component={Link}
      href={`/brands/${brand.id}`}
      elevation={0}
      className={styles.card}
      style={cssVars}
    >
      <Box className={styles.body}>
        <Avatar className={styles.avatar}>{brand.emoji}</Avatar>

        <Typography variant="h6" component="h2" className={styles.label}>
          {brand.label}
        </Typography>

        <Typography variant="body2" color="text.secondary" className={styles.description}>
          {brand.description}
        </Typography>
      </Box>

      <Box className={styles.footer}>
        <Box className={styles.markets}>
          {brand.markets.map((market) => (
            <Chip
              key={market}
              label={market}
              size="small"
              variant="outlined"
              className={styles.marketPill}
            />
          ))}
        </Box>

        <Box className={styles.cta}>
          <Typography component="span" className={styles.ctaLabel}>
            Open
          </Typography>
          <ArrowForwardIcon className={styles.ctaIcon} />
        </Box>
      </Box>
    </Card>
  )
})
