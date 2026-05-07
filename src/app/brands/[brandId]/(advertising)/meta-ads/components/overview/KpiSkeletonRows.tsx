import styles from './OverviewTab.module.css'

const SKELETON_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

export default function KpiSkeletonRows(): JSX.Element {
  return (
    <div className={styles.skeletonGrid}>
      {SKELETON_KEYS.map((key) => (
        <div key={key} className={styles.skeletonTile} />
      ))}
    </div>
  )
}
