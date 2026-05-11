import { memo, type CSSProperties, type ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import DesktopMacIcon from '@mui/icons-material/DesktopMac'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import TabletMacIcon from '@mui/icons-material/TabletMac'
import { formatPercentage } from '@/lib/meta/fx'
import type { DeviceBreakdownPoint, DeviceCategory } from '@/types/dashboard'
import styles from './AnalyticsDevices.module.css'

interface Props {
  readonly devices: readonly DeviceBreakdownPoint[]
}

const DEVICE_LABEL: Record<DeviceCategory, string> = {
  mobile: 'Mobile',
  desktop: 'Desktop',
  tablet: 'Tablet',
}

function AnalyticsDevices({ devices }: Props): JSX.Element {
  if (devices.length === 0) {
    return (
      <Alert severity="info" variant="outlined">
        Device breakdown not yet available.
      </Alert>
    )
  }

  return (
    <Box className={styles.list}>
      {devices.map((d) => {
        const fillStyle = { '--fill': `${(d.share * 100).toFixed(1)}%` } as CSSProperties
        return (
          <Box key={d.device} className={styles.row} data-device={d.device}>
            <Box className={styles.head}>
              <Box component="span" className={styles.icon} aria-hidden="true">
                {deviceIcon(d.device)}
              </Box>
              <Typography component="span" variant="body2" className={styles.label}>
                {DEVICE_LABEL[d.device]}
              </Typography>
              <Typography component="span" variant="body2" className={styles.share}>
                {formatPercentage(d.share, 1)}
              </Typography>
            </Box>
            <Box className={styles.bar}>
              <Box className={styles.barFill} style={fillStyle} />
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

export default memo(AnalyticsDevices)

function deviceIcon(device: DeviceCategory): ReactNode {
  if (device === 'mobile') return <SmartphoneIcon fontSize="small" />
  if (device === 'desktop') return <DesktopMacIcon fontSize="small" />
  return <TabletMacIcon fontSize="small" />
}
