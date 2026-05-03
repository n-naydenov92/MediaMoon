import styles from '../page.module.css'

export default function LaunchPage(): JSX.Element {
  return (
    <section className={styles.root}>
      <div className={styles.notice} data-variant="info">
        <strong>Coming next</strong>
        <p>
          Bulk creative upload with server-side queue (Vercel Blob + Inngest) — pending external service
          credentials.
        </p>
      </div>
    </section>
  )
}
