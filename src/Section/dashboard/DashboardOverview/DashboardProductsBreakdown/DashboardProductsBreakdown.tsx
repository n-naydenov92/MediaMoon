import Box from '@mui/material/Box'
import type {
  CategoryBreakdownPoint,
  DashboardTopProduct,
} from '@/types/dashboard'
import DashboardCategoryBreakdown from '../DashboardCategoryBreakdown/DashboardCategoryBreakdown'
import DashboardTopProducts from '../../DashboardTopProducts/DashboardTopProducts'
import styles from './DashboardProductsBreakdown.module.css'

interface Props {
  readonly products: readonly DashboardTopProduct[]
  readonly categories: readonly CategoryBreakdownPoint[]
  readonly hasCommerce: boolean
  readonly loading?: boolean
}

export default function DashboardProductsBreakdown({
  products,
  categories,
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
        <DashboardCategoryBreakdown
          categories={categories}
          hasCommerce={hasCommerce}
          loading={loading}
        />
      </Box>
    </Box>
  )
}
