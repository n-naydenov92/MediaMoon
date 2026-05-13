import { memo } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { formatPercentage } from '@/lib/meta/fx'
import type { TopLandingPage } from '@/types/dashboard'
import styles from './AnalyticsTopPages.module.css'

interface Props {
  readonly pages: readonly TopLandingPage[]
}

export default memo(function AnalyticsTopPages({ pages }: Props): JSX.Element {
  if (pages.length === 0) {
    return (
      <Alert severity="info" variant="outlined">
        Top landing pages not yet available.
      </Alert>
    )
  }

  return (
    <Box className={styles.list}>
      <Box className={styles.header}>
        <Typography component="span" variant="caption" className={styles.headerCell}>
          Page
        </Typography>
        <Typography
          component="span"
          variant="caption"
          className={`${styles.headerCell} ${styles.headerUsers}`}
        >
          Users
        </Typography>
        <Tooltip title="Average Page conversion rate" placement="top" arrow disableInteractive>
          <Typography
            component="span"
            variant="caption"
            className={`${styles.headerCell} ${styles.headerCr}`}
          >
            CR%
          </Typography>
        </Tooltip>
      </Box>
      {pages.map((p) => {
        const activeUsers = p.activeUsers ?? 0
        const conversions = p.conversions ?? 0
        const conversionRate = p.conversionRate ?? 0
        const crTitle = `${conversions.toLocaleString('en-GB')} purchases ÷ ${activeUsers.toLocaleString('en-GB')} active users`
        return (
          <Box key={p.path} className={styles.row}>
            <Tooltip title={p.path} placement="top" arrow disableInteractive>
              <Typography component="span" variant="body2" className={styles.path}>
                {p.path}
              </Typography>
            </Tooltip>
            <Typography component="span" variant="body2" className={styles.users}>
              {activeUsers.toLocaleString('en-GB')}
            </Typography>
            <Tooltip title={crTitle} placement="top" arrow disableInteractive>
              <Typography
                component="span"
                variant="body2"
                className={styles.cr}
                data-zero={conversionRate === 0 ? 'true' : 'false'}
              >
                {formatPercentage(conversionRate, 2)}
              </Typography>
            </Tooltip>
          </Box>
        )
      })}
    </Box>
  )
})
