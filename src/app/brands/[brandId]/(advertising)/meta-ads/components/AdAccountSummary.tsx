import { memo } from 'react'
import type { AdAccount } from '@/lib/gateways/MetaAdsGateway'
import styles from './AdAccountSummary.module.css'

interface Props {
  readonly account: AdAccount
  readonly brandColor: string
}

const STATUS_LABELS: Record<number, { readonly label: string; readonly tone: 'active' | 'inactive' | 'warn' }> = {
  1: { label: 'Active', tone: 'active' },
  2: { label: 'Disabled', tone: 'inactive' },
  3: { label: 'Unsettled', tone: 'warn' },
  7: { label: 'Pending review', tone: 'warn' },
  8: { label: 'Pending settlement', tone: 'warn' },
  9: { label: 'In grace period', tone: 'warn' },
  100: { label: 'Pending closure', tone: 'inactive' },
  101: { label: 'Closed', tone: 'inactive' },
}

function statusFor(code: number): { readonly label: string; readonly tone: 'active' | 'inactive' | 'warn' } {
  return STATUS_LABELS[code] ?? { label: `Status ${code}`, tone: 'warn' }
}

export default memo(({ account, brandColor }: Props): JSX.Element => {
  const status = statusFor(account.accountStatus)
  return (
    <div
      className={styles.card}
      style={{ '--brand-color': brandColor } as React.CSSProperties}
    >
      <div className={styles.accent} />
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <span className={styles.name}>{account.name}</span>
          <span className={styles.status} data-tone={status.tone}>
            {status.label}
          </span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.id}>{account.id}</span>
          <span className={styles.dot}>•</span>
          <span className={styles.currency}>{account.currency}</span>
          <span className={styles.dot}>•</span>
          <span className={styles.timezone}>{account.timezoneName}</span>
        </div>
      </div>
    </div>
  )
})
