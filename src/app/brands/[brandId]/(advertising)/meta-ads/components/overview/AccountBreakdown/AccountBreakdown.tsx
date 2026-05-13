import type { AccountSummary } from '@/lib/meta/aggregate'
import { formatEur, formatRoas } from '@/lib/meta/fx'
import { classifyRoas } from '@/lib/meta/roasClassification'
import { cssVars } from '@/lib/css'
import styles from './AccountBreakdown.module.css'

interface Props {
  readonly accounts: readonly AccountSummary[]
}

export default function AccountBreakdown({ accounts }: Props): JSX.Element {
  if (accounts.length === 0) {
    return <div className={styles.empty}>No accounts configured for this view.</div>
  }
  const maxSpend = Math.max(...accounts.map((a) => a.spendEur), 1)
  return (
    <ul className={styles.list}>
      {accounts.map((account) => {
        const fillPct = `${(account.spendEur / maxSpend) * 100}%`
        const adsLabel = account.activeAdsCount === 1 ? 'active ad' : 'active ads'
        return (
          <li key={account.accountId} className={styles.row}>
            <div className={styles.head}>
              <span className={styles.name}>{account.accountName}</span>
              <span className={styles.spend}>{formatEur(account.spendEur)}</span>
            </div>
            <div className={styles.bar} style={cssVars({ '--fill-pct': fillPct })}>
              <span className={styles.barFill} />
            </div>
            <div className={styles.meta}>
              <span className={styles.roas} data-tier={classifyRoas(account.roas)}>
                ROAS {formatRoas(account.roas)}
              </span>
              <span className={styles.dot}>·</span>
              <span>{account.activeAdsCount} {adsLabel}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
