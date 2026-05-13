import { type CSSProperties } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import styles from '../DashboardChartLegend.module.css'

interface Props {
  readonly color: string
  readonly label: string
}

export default function LegendDot({ color, label }: Props): JSX.Element {
  const dotStyle = { '--dot-color': color } as CSSProperties
  return (
    <Box component="span" className={styles.legendItem}>
      <Box component="span" className={styles.legendDot} style={dotStyle} />
      <Typography component="span" variant="caption">
        {label}
      </Typography>
    </Box>
  )
}
