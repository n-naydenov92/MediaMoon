import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { formatEur } from '@/lib/meta/fx'
import type { DashboardTopProduct } from '@/types/dashboard'
import styles from './DashboardTopProducts.module.css'

interface Props {
  readonly products: readonly DashboardTopProduct[]
  readonly hasCommerce: boolean
  readonly loading?: boolean
}

const SKELETON_COUNT = 5

export default function DashboardTopProducts({ products, hasCommerce, loading = false }: Props): JSX.Element {
  return (
    <Card variant="outlined" className={styles.card}>
      <CardHeader
        title="Top products"
        titleTypographyProps={{ variant: 'subtitle1', className: styles.title }}
        className={styles.header}
      />
      <CardContent className={styles.content}>
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
          <List disablePadding className={styles.list}>
            {products.map((product, index) => (
              <ListItem key={product.productId} disableGutters className={styles.row}>
                <Stack direction="row" alignItems="baseline" gap={1.5} className={styles.titleCol}>
                  <Typography component="span" variant="body2" className={styles.rank}>
                    {index + 1}.
                  </Typography>
                  <Typography component="span" variant="body2" className={styles.name}>
                    {product.title}
                  </Typography>
                </Stack>
                <Typography component="span" variant="body2" className={styles.qty}>
                  {product.quantity} sold
                </Typography>
                <Typography component="span" variant="body2" className={styles.revenue}>
                  {formatEur(product.revenue)}
                </Typography>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  )
}

function SkeletonRows(): JSX.Element {
  return (
    <Stack className={styles.skeletons}>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <Skeleton key={i} variant="text" height={28} />
      ))}
    </Stack>
  )
}
