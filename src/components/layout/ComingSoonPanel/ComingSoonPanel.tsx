import { memo } from 'react'
import Box from '@mui/material/Box'
import styles from './ComingSoonPanel.module.css'

interface Props {
  readonly moduleLabel: string
  readonly brandLabel?: string
}

function ComingSoonPanel({ moduleLabel, brandLabel }: Props): JSX.Element {
  return (
    <Box component="section" className={styles.root}>
      <Box className={styles.card}>
        <Box component="span" className={styles.eyebrow}>Coming soon</Box>
        <Box component="h1" className={styles.heading}>{moduleLabel}</Box>
        <Box component="p" className={styles.body}>
          {brandLabel
            ? `The ${moduleLabel} dashboard for ${brandLabel} is being built.`
            : `The ${moduleLabel} dashboard is being built.`}
        </Box>
      </Box>
    </Box>
  )
}

export default memo(ComingSoonPanel)
