import Box from '@mui/material/Box'
import styles from '../CreativePreviewCard.module.css'

export default function CardSkeleton(): JSX.Element {
  return (
    <>
      <Box className={styles.headerRow}>
        <Box className={`${styles.avatar} ${styles.skeletonBlock}`} />
        <Box className={styles.headerText}>
          <Box className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
          <Box className={`${styles.skeletonLine} ${styles.skeletonLineNarrow}`} />
        </Box>
      </Box>
      <Box className={`${styles.skeletonBody} ${styles.skeletonBlock}`} />
      <Box className={`${styles.skeletonMedia} ${styles.skeletonBlock}`} />
      <Box className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
    </>
  )
}
