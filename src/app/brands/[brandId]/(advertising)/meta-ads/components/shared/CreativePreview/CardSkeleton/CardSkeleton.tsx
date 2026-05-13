import styles from '../CreativePreviewCard/CreativePreviewCard.module.css'

export default function CardSkeleton(): JSX.Element {
  return (
    <>
      <div className={styles.headerRow}>
        <div className={`${styles.avatar} ${styles.skeletonBlock}`} />
        <div className={styles.headerText}>
          <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLineNarrow}`} />
        </div>
      </div>
      <div className={`${styles.skeletonBody} ${styles.skeletonBlock}`} />
      <div className={`${styles.skeletonMedia} ${styles.skeletonBlock}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
    </>
  )
}
