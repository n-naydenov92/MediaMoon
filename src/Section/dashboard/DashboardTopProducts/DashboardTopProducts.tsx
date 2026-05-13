'use client'

import { useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Tooltip from '@mui/material/Tooltip'
import { formatEur } from '@/lib/meta/fx'
import type { DashboardTopProduct } from '@/types/dashboard'
import { decodeProductTitle } from '../shared/productTitle'
import SkeletonRows from '../shared/SkeletonRows/SkeletonRows'
import styles from './DashboardTopProducts.module.css'

interface Props {
  readonly products: readonly DashboardTopProduct[]
  readonly hasCommerce: boolean
  readonly loading?: boolean
}

type SortField = 'quantity' | 'revenue'
type SortDir = 'asc' | 'desc'

export default function DashboardTopProducts({
  products,
  hasCommerce,
  loading = false,
}: Props): JSX.Element {
  const [sortField, setSortField] = useState<SortField>('revenue')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(() => {
    const copy = [...products]
    copy.sort((a, b) => {
      const av = sortField === 'revenue' ? a.revenue : a.quantity
      const bv = sortField === 'revenue' ? b.revenue : b.quantity
      return sortDir === 'desc' ? bv - av : av - bv
    })
    return copy
  }, [products, sortField, sortDir])

  const handleSort = (field: SortField): void => {
    if (field === sortField) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  return (
    <Card variant="outlined" className={styles.card}>
      <CardHeader
        title="Top products"
        titleTypographyProps={{ variant: 'subtitle1', className: styles.title }}
        className={styles.header}
      />
      <Box className={styles.content}>
        {loading && <SkeletonRows />}
        {!loading && !hasCommerce && (
          <Alert severity="info" variant="outlined" className={styles.empty}>
            Магазинът не е свързан за този бранд.
          </Alert>
        )}
        {!loading && hasCommerce && products.length === 0 && (
          <Alert severity="info" variant="outlined" className={styles.empty}>
            Няма продажби за този период.
          </Alert>
        )}
        {!loading && hasCommerce && products.length > 0 && (
          <TableContainer className={styles.tableWrap}>
            <Table size="small" className={styles.table}>
              <TableHead>
                <TableRow>
                  <TableCell className={styles.rankCell}>#</TableCell>
                  <TableCell className={styles.nameCell}>Product</TableCell>
                  <TableCell
                    align="right"
                    sortDirection={sortField === 'quantity' ? sortDir : false}
                    className={styles.qtyCell}
                  >
                    <TableSortLabel
                      active={sortField === 'quantity'}
                      direction={sortField === 'quantity' ? sortDir : 'desc'}
                      onClick={() => handleSort('quantity')}
                    >
                      Sold
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    align="right"
                    sortDirection={sortField === 'revenue' ? sortDir : false}
                    className={styles.revenueCell}
                  >
                    <TableSortLabel
                      active={sortField === 'revenue'}
                      direction={sortField === 'revenue' ? sortDir : 'desc'}
                      onClick={() => handleSort('revenue')}
                    >
                      Revenue
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map((product, index) => {
                  const decoded = decodeProductTitle(product.title)
                  return (
                    <TableRow key={product.productId} hover>
                      <TableCell className={`${styles.rankCell} ${styles.rank}`}>
                        {String(index + 1).padStart(2, '0')}
                      </TableCell>
                      <TableCell className={`${styles.nameCell} ${styles.name}`}>
                        <Tooltip title={decoded} placement="top-start" arrow disableInteractive>
                          <Box component="span">{decoded}</Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell
                        align="right"
                        className={`${styles.qtyCell} ${styles.qty}`}
                      >
                        {product.quantity.toLocaleString('en-GB')}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={`${styles.revenueCell} ${styles.revenue}`}
                      >
                        {formatEur(product.revenue)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Card>
  )
}
