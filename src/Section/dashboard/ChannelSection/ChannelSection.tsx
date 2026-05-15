import { type ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import styles from './ChannelSection.module.css'

export type ChannelStatus = 'live' | 'not-wired'

interface Props {
  readonly title: string
  readonly icon: ReactNode
  readonly status: ChannelStatus
  readonly tileCount?: 5 | 6
  readonly children: ReactNode
  readonly notWiredMessage?: string
}

export default function ChannelSection({
  title,
  icon,
  status,
  tileCount,
  children,
  notWiredMessage,
}: Props): JSX.Element {
  const headerTitle = (
    <Box className={styles.headerInner}>
      <Box component="span" className={styles.brandIcon} aria-hidden="true">
        {icon}
      </Box>
      <Typography component="span" variant="subtitle1" className={styles.title}>
        {title}
      </Typography>
      {status === 'not-wired' && (
        <Box component="span" className={styles.statusPill} data-status={status}>
          <Box component="span" className={styles.statusDot} aria-hidden="true" />
          not wired
        </Box>
      )}
    </Box>
  )

  return (
    <Card variant="outlined" className={styles.card}>
      <CardHeader title={headerTitle} className={styles.header} disableTypography />
      <CardContent className={styles.content}>
        {tileCount ? (
          <Box
            className={`${styles.kpiGrid} ${status === 'not-wired' ? styles.dimmed : ''}`.trim()}
            data-cols={String(tileCount)}
          >
            {children}
          </Box>
        ) : (
          <Box className={status === 'not-wired' ? styles.dimmed : undefined}>
            {children}
          </Box>
        )}
        {status === 'not-wired' && notWiredMessage && (
          <Alert severity="info" variant="outlined" className={styles.notWiredNote}>
            {notWiredMessage}
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
