'use client'

import { memo, type ReactNode } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckIcon from '@mui/icons-material/Check'
import styles from './StepAccordion.module.css'

interface Props {
  readonly index: number
  readonly title: string
  readonly complete: boolean
  readonly expanded: boolean
  readonly onToggle: () => void
  readonly children: ReactNode
}

export default memo(function StepAccordion({
  index,
  title,
  complete,
  expanded,
  onToggle,
  children,
}: Props): JSX.Element {
  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      disableGutters
      square
      slotProps={{ transition: { unmountOnExit: false } }}
      classes={{ root: styles.root, expanded: styles.expandedAccordion }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon className={styles.chevron} />}
        classes={{ root: styles.summary, content: styles.summaryContent }}
      >
        <Box className={styles.header}>
          <Typography component="span" variant="inherit" className={styles.index}>{`Step ${index}`}</Typography>
          <Typography component="span" variant="inherit" className={styles.title}>{title}</Typography>
        </Box>
        <Box
          component="span"
          className={styles.status}
          data-complete={complete ? 'true' : 'false'}
          aria-label={complete ? 'Step complete' : 'Step incomplete'}
        >
          {complete && <CheckIcon className={styles.checkIcon} fontSize="inherit" />}
        </Box>
      </AccordionSummary>
      <AccordionDetails classes={{ root: styles.details }}>{children}</AccordionDetails>
    </Accordion>
  )
})
