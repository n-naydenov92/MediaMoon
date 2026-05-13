'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import styles from '../CreativePreviewCard.module.css'

const CLIP_DETECTION_PIXEL_BUFFER = 1

interface Props {
  readonly body: string
}

export default function CardBody({ body }: Props): JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const [isClipped, setIsClipped] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useLayoutEffect(() => {
    if (expanded || !textRef.current) {
      return
    }
    const el = textRef.current
    setIsClipped(el.scrollHeight > el.clientHeight + CLIP_DETECTION_PIXEL_BUFFER)
  }, [body, expanded])

  return (
    <Box className={styles.body} data-expanded={expanded}>
      <Typography ref={textRef} variant="body2" className={styles.bodyText}>{body}</Typography>
      {isClipped && !expanded && (
        <Button type="button" variant="text" className={styles.seeMore} onClick={() => setExpanded(true)}>
          See more
        </Button>
      )}
    </Box>
  )
}
