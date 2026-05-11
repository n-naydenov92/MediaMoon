import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import styles from './RechartsTooltipShell.module.css'

interface Props {
  readonly label: string
  readonly value: string
  readonly secondary?: string
}

export default function RechartsTooltipShell({ label, value, secondary }: Props): JSX.Element {
  return (
    <Card variant="outlined" className={styles.tooltip}>
      <Box className={styles.tooltipContent}>
        <Typography variant="caption" className={styles.tooltipLabel}>
          {label}
        </Typography>
        <Typography variant="body2" className={styles.tooltipValue}>
          {value}
        </Typography>
        {secondary && (
          <Typography variant="body2" className={styles.tooltipSecondary}>
            {secondary}
          </Typography>
        )}
      </Box>
    </Card>
  )
}
