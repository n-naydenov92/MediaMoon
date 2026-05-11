import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import styles from './KpiSkeletons.module.css'

const SKELETON_KPI_COUNT = 6

export default function KpiSkeletons(): JSX.Element {
  return (
    <Box className={styles.skeletonGrid}>
      {Array.from({ length: SKELETON_KPI_COUNT }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={108} />
      ))}
    </Box>
  )
}
