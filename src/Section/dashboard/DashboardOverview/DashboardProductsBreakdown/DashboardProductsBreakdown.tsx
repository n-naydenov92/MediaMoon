import Box from '@mui/material/Box'
import type {
  CategoryBreakdownPoint,
  DashboardTopProduct,
} from '@/types/dashboard'
import AnchorProductScore from '../../AnchorProductScore/AnchorProductScore'
import DashboardCategoryBreakdown from '../DashboardCategoryBreakdown/DashboardCategoryBreakdown'
import DashboardTopProducts from '../../DashboardTopProducts/DashboardTopProducts'
import styles from './DashboardProductsBreakdown.module.css'

interface Props {
  readonly products: readonly DashboardTopProduct[]
  readonly categories: readonly CategoryBreakdownPoint[]
  readonly storeAov: number | null
  readonly hasCommerce: boolean
  readonly loading?: boolean
}

export default function DashboardProductsBreakdown({
  products,
  categories,
  storeAov,
  hasCommerce,
  loading = false,
}: Props): JSX.Element {
  return (
    <Box className={styles.row}>
      <Box className={`${styles.col} ${styles.productsCol}`}>
        <DashboardTopProducts
          products={products}
          hasCommerce={hasCommerce}
          loading={loading}
        />
      </Box>
      <Box className={`${styles.col} ${styles.categoryCol}`}>
        <Box className={styles.rightStack}>
          <DashboardCategoryBreakdown
            categories={categories}
            hasCommerce={hasCommerce}
            loading={loading}
          />
          <AnchorProductScore
            products={products}
            storeAov={storeAov}
            hasCommerce={hasCommerce}
            loading={loading}
          />
        </Box>
      </Box>
    </Box>
  )
}
