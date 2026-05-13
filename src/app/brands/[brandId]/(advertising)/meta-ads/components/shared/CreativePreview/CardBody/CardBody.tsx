'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import styles from '../CreativePreviewCard/CreativePreviewCard.module.css'

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
    <div className={styles.body} data-expanded={expanded}>
      <p ref={textRef} className={styles.bodyText}>{body}</p>
      {isClipped && !expanded && (
        <button type="button" className={styles.seeMore} onClick={() => setExpanded(true)}>
          See more
        </button>
      )}
    </div>
  )
}
