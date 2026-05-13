import Box from '@mui/material/Box'
import styles from '../OverviewTab/OverviewTab.module.css'

const SKELETON_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

export default function KpiSkeletonRows(): JSX.Element {
  return (
    <Box className={styles.skeletonGrid}>
      {SKELETON_KEYS.map((key) => (
        <Box key={key} className={styles.skeletonTile} />
      ))}
    </Box>
  )
}
