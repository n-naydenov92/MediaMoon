'use client'

import { memo, type CSSProperties } from 'react'
import Link from 'next/link'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import type { BrandConfig } from '@/types'
import styles from './BrandCard.module.css'

interface Props {
  readonly brand: BrandConfig
}

export default memo(function BrandCard({ brand }: Props): JSX.Element {
  const cssVars = { '--brand-color': brand.color } as CSSProperties

  return (
    <Card elevation={0} className={styles.card} style={cssVars}>
      <CardContent className={styles.content}>
        <Avatar className={styles.avatar}>{brand.emoji}</Avatar>

        <Typography variant="h6" component="h2" className={styles.label}>
          {brand.label}
        </Typography>

        <Typography variant="body2" color="text.secondary" className={styles.description}>
          {brand.description}
        </Typography>

        <Button
          component={Link}
          href={`/brands/${brand.id}`}
          variant="contained"
          disableElevation
          size="small"
          className={styles.cta}
        >
          Open Dashboard
        </Button>
      </CardContent>
    </Card>
  )
})
