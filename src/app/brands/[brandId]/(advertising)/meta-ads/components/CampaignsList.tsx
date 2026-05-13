import { memo } from 'react'
import type { Campaign } from '@/lib/gateways/MetaAdsGateway'
import styles from './CampaignsList.module.css'

interface Props {
  readonly campaigns: readonly Campaign[]
}

function toneFor(effectiveStatus: string): 'active' | 'inactive' | 'warn' {
  if (effectiveStatus === 'ACTIVE') return 'active'
  if (effectiveStatus === 'PAUSED' || effectiveStatus === 'ARCHIVED' || effectiveStatus === 'DELETED') return 'inactive'
  return 'warn'
}

export default memo(({ campaigns }: Props): JSX.Element => (
  <section className={styles.section}>
    <header className={styles.header}>
      <h2 className={styles.heading}>Campaigns</h2>
      <span className={styles.count}>{campaigns.length}</span>
    </header>

    {campaigns.length === 0 ? (
      <div className={styles.empty}>No campaigns in this ad account.</div>
    ) : (
      <ul className={styles.list}>
        {campaigns.map((campaign) => (
          <li key={campaign.id} className={styles.item}>
            <div className={styles.titleRow}>
              <span className={styles.name}>{campaign.name}</span>
              <span className={styles.status} data-tone={toneFor(campaign.effectiveStatus)}>
                {campaign.effectiveStatus}
              </span>
            </div>
            <span className={styles.id}>{campaign.id}</span>
          </li>
        ))}
      </ul>
    )}
  </section>
))
