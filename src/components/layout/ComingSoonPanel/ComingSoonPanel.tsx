import { memo } from 'react'
import styles from './ComingSoonPanel.module.css'

interface Props {
  readonly moduleLabel: string
  readonly brandLabel?: string
}

export default memo(function ComingSoonPanel({
  moduleLabel,
  brandLabel,
}: Props): JSX.Element {
  return (
    <section className={styles.root}>
      <div className={styles.card}>
        <span className={styles.eyebrow}>Coming soon</span>
        <h1 className={styles.heading}>{moduleLabel}</h1>
        <p className={styles.body}>
          {brandLabel
            ? `The ${moduleLabel} dashboard for ${brandLabel} is being built.`
            : `The ${moduleLabel} dashboard is being built.`}
        </p>
      </div>
    </section>
  )
})
