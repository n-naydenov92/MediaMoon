'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useLineClamp } from '../../../hooks/useLineClamp'
import styles from '../CreativePreviewCard.module.css'

interface Props {
  readonly body: string
}

export default function CardBody({ body }: Props): JSX.Element {
  const { ref, isClamped, isExpanded, toggle } = useLineClamp<HTMLParagraphElement>(body)

  return (
    <Box className={styles.body} data-expanded={isExpanded}>
      <Typography ref={ref} variant="body2" className={styles.bodyText}>{body}</Typography>
      {isClamped && !isExpanded && (
        <Button type="button" variant="text" className={styles.seeMore} onClick={toggle}>
          See more
        </Button>
      )}
    </Box>
  )
}
