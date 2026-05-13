'use client'

import { memo } from 'react'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import { LABELS } from '@/components/layout/labels'
import styles from './BrandMenu.module.css'

interface Props {
  readonly query: string
}

const BrandMenuEmpty = memo(function BrandMenuEmpty({ query }: Props): JSX.Element {
  return (
    <div className={styles.empty} role="status">
      <span className={styles.emptyIcon} aria-hidden="true">
        <Inventory2OutlinedIcon />
      </span>
      <span className={styles.emptyHeadline}>{LABELS.sidebar.noBrandsMatch}</span>
      <span className={styles.emptyHint}>“{query}”</span>
    </div>
  )
})

export default BrandMenuEmpty
