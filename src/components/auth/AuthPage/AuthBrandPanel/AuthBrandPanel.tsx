import Box from '@mui/material/Box'
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
    <Box component="aside" className={styles.panel} aria-label="MediaMon">
      <Box className={styles.pattern} aria-hidden="true" />
      <Box className={styles.wordmark}>{LABELS.app.name}</Box>

      <Box className={styles.modules}>
        <Box className={styles.modulesHeader}>Modules</Box>
        <Box component="ul" className={styles.moduleList}>
          {MODULES.map((module) => (
            <Box component="li" key={module.name} className={styles.moduleRow}>
              <Box component="span" className={styles.moduleName}>{module.name}</Box>
              <Box component="span" className={styles[`status_${module.status}`]}>
                {STATUS_LABEL[module.status]}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box component="blockquote" className={styles.quote}>
        <Box component="p" className={styles.quoteText}>{BRAND_QUOTE}</Box>
        <Box component="footer" className={styles.attribution}>
          {BRAND_QUOTE_ATTRIBUTION}
        </Box>
      </Box>
    </Box>
  )
}
