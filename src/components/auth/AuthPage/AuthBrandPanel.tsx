import { LABELS } from '@/components/layout/labels'
import styles from './AuthBrandPanel.module.css'

const BRAND_QUOTE =
  'Instead of logging into a thousand places, you have one control hub from which you manage your business.'
const BRAND_QUOTE_ATTRIBUTION = 'MediaMon — Internal Operations'

type ModuleStatus = 'live' | 'soon'

interface ModuleEntry {
  readonly name: string
  readonly status: ModuleStatus
}

const MODULES: readonly ModuleEntry[] = [
  { name: 'Trending News', status: 'live' },
  { name: 'Meta Ads', status: 'live' },
  { name: 'Data Table', status: 'soon' },
  { name: 'Email Automation', status: 'soon' },
  { name: 'Video Generator', status: 'soon' },
]

const STATUS_LABEL: Record<ModuleStatus, string> = {
  live: 'LIVE',
  soon: 'SOON',
}

export default function AuthBrandPanel(): JSX.Element {
  return (
    <aside className={styles.panel} aria-label="MediaMon">
      <div className={styles.pattern} aria-hidden="true" />
      <div className={styles.wordmark}>{LABELS.app.name}</div>

      <div className={styles.modules}>
        <div className={styles.modulesHeader}>Modules</div>
        <ul className={styles.moduleList}>
          {MODULES.map((module) => (
            <li key={module.name} className={styles.moduleRow}>
              <span className={styles.moduleName}>{module.name}</span>
              <span className={styles[`status_${module.status}`]}>
                {STATUS_LABEL[module.status]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <blockquote className={styles.quote}>
        <p className={styles.quoteText}>{BRAND_QUOTE}</p>
        <footer className={styles.attribution}>{BRAND_QUOTE_ATTRIBUTION}</footer>
      </blockquote>
    </aside>
  )
}
