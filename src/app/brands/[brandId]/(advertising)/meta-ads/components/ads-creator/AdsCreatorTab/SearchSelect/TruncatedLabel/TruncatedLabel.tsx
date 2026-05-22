'use client'

import { memo, useEffect, useRef, useState } from 'react'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

interface Props {
  readonly label: string
  readonly className?: string
}

export default memo(function TruncatedLabel({ label, className }: Props): JSX.Element {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setIsTruncated(el.scrollWidth > el.clientWidth)
  }, [label])

  return (
    <Tooltip title={isTruncated ? label : ''} disableInteractive enterDelay={300}>
      <Typography ref={ref} component="span" variant="inherit" className={className}>
        {label}
      </Typography>
    </Tooltip>
  )
})
