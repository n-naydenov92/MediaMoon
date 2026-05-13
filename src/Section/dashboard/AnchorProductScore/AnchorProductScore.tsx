'use client'

import { memo, useMemo } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { formatEur, formatPercentage } from '@/lib/meta/fx'
import type { DashboardTopProduct } from '@/types/dashboard'
import { decodeProductTitle } from '../shared/productTitle'
import SkeletonRows from '../shared/SkeletonRows'
import styles from './AnchorProductScore.module.css'

interface Props {
  readonly products: readonly DashboardTopProduct[]
  readonly storeAov: number | null
  readonly hasCommerce: boolean
  readonly loading?: boolean
}

const TOP_N = 8
const MIN_ORDERS_THRESHOLD = 5

interface AnchorRow {
  readonly productId: number
  readonly title: string
  readonly anchorAov: number
  readonly anchorOrders: number
  readonly deltaVsStore: number | null
}

function AnchorProductScore({
  products,
  storeAov,
  hasCommerce,
  loading = false,
}: Props): JSX.Element {
  const rows = useMemo<readonly AnchorRow[]>(() => {
    const enriched = products
      .filter((p) => p.anchorAov !== null && p.anchorOrders >= MIN_ORDERS_THRESHOLD)
      .map<AnchorRow>((p) => ({
        productId: p.productId,
        title: decodeProductTitle(p.title),
        anchorAov: p.anchorAov ?? 0,
        anchorOrders: p.anchorOrders,
        deltaVsStore:
          storeAov !== null && storeAov > 0 ? p.anchorAov! / storeAov - 1 : null,
      }))
    enriched.sort((a, b) => b.anchorAov - a.anchorAov)
    return enriched.slice(0, TOP_N)
  }, [products, storeAov])

  if (loading) {
    return (
      <Card variant="outlined" className={styles.card}>
        <CardHeader
          title="Anchor Product Score"
          titleTypographyProps={{ variant: 'subtitle1', className: styles.title }}
          className={styles.header}
        />
        <Box className={styles.content}>
          <SkeletonRows />
        </Box>
      </Card>
    )
  }

  if (!hasCommerce) {
    return (
      <Card variant="outlined" className={styles.card}>
        <CardHeader
          title="Anchor Product Score"
          titleTypographyProps={{ variant: 'subtitle1', className: styles.title }}
          className={styles.header}
        />
        <Box className={styles.content}>
          <Alert severity="info" variant="outlined" className={styles.empty}>
            Магазинът не е свързан за този бранд.
          </Alert>
        </Box>
      </Card>
    )
  }

  if (rows.length === 0) {
    return (
      <Card variant="outlined" className={styles.card}>
        <CardHeader
          title="Anchor Product Score"
          titleTypographyProps={{ variant: 'subtitle1', className: styles.title }}
          className={styles.header}
        />
        <Box className={styles.content}>
          <Alert severity="info" variant="outlined" className={styles.empty}>
            Не достатъчно поръчки за изчисляване (минимум {MIN_ORDERS_THRESHOLD} поръчки на продукт).
          </Alert>
        </Box>
      </Card>
    )
  }

  return (
    <Card variant="outlined" className={styles.card}>
      <CardHeader
        title="Anchor Product Score"
        titleTypographyProps={{ variant: 'subtitle1', className: styles.title }}
        className={styles.header}
      />
      <Tooltip
        title="Average order value when this product is in the cart. Higher than store average = anchor product (pulls bigger baskets). Lower = solo seller (bundle opportunity)."
        placement="top"
        arrow
        disableInteractive
      >
        <Typography component="div" className={styles.subhead}>
          {`Avg order value of orders containing the product. Higher = anchor; lower = solo seller. Min ${MIN_ORDERS_THRESHOLD} orders per product`}
          {storeAov !== null && ` · Store avg ${formatEur(storeAov)}`}
        </Typography>
      </Tooltip>
      <Box className={styles.content}>
        <Box className={styles.list}>
          {rows.map((row) => (
            <Box key={row.productId} className={styles.row}>
              <Tooltip title={row.title} placement="top-start" arrow disableInteractive>
                <Typography component="span" variant="body2" className={styles.name}>
                  {row.title}
                </Typography>
              </Tooltip>
              <Typography component="span" variant="body2" className={styles.aov}>
                {formatEur(row.anchorAov)}
              </Typography>
              <Typography component="span" variant="caption" className={styles.meta}>
                {`${row.anchorOrders.toLocaleString('en-GB')} orders`}
              </Typography>
              <Typography
                component="span"
                variant="caption"
                className={styles.delta}
                data-tier={tierFor(row.deltaVsStore)}
              >
                {formatDelta(row.deltaVsStore)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Card>
  )
}

export default memo(AnchorProductScore)

function tierFor(delta: number | null): 'anchor' | 'solo' | 'neutral' {
  if (delta === null) {
    return 'neutral'
  }
  if (delta >= 0.1) {
    return 'anchor'
  }
  if (delta <= -0.1) {
    return 'solo'
  }
  return 'neutral'
}

function formatDelta(delta: number | null): string {
  if (delta === null) {
    return '—'
  }
  return `${arrowForDelta(delta)} ${formatPercentage(Math.abs(delta), 0)} vs store`
}

function arrowForDelta(delta: number): string {
  if (delta > 0) {
    return '↗'
  }
  if (delta < 0) {
    return '↘'
  }
  return '→'
}
