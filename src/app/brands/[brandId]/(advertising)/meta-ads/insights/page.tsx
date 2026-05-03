import styles from '../page.module.css'

export default function InsightsPage(): JSX.Element {
  return (
    <section className={styles.root}>
      <div className={styles.notice} data-variant="info">
        <strong>Coming next</strong>
        <p>Audience / placement / age &amp; gender breakdowns — landing after Overview ships.</p>
      </div>
    </section>
  )
}
