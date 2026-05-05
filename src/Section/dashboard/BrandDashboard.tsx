import type { BrandConfig } from '@/types'
import styles from './BrandDashboard.module.css'

interface Props {
  readonly brand: BrandConfig
}

export default function BrandDashboard({ brand }: Props): JSX.Element {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.emoji} aria-hidden="true">{brand.emoji}</span>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{brand.label}</h1>
          <p className={styles.subtitle}>{brand.description}</p>
        </div>
      </header>

      <section className={styles.placeholder}>
        <h2 className={styles.placeholderTitle}>Dashboard</h2>
        <p className={styles.placeholderBody}>
          Cross-module summary for this brand will live here. KPIs from
          Advertising, Trending News, and other modules will be aggregated
          on this page.
        </p>
      </section>
    </div>
  )
}
