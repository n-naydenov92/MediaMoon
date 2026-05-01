'use client'

import { useEffect, useState } from 'react'
import { formatRemaining } from '@/components/layout/Topbar/helpers'

const COUNTDOWN_TICK_MS = 30_000

export function useCountdownString(expiry: string | null): string {
  const [text, setText] = useState<string>(() => (expiry ? formatRemaining(expiry) : ''))

  useEffect(() => {
    if (!expiry) {
      setText('')
      return
    }
    setText(formatRemaining(expiry))
    const timer = setInterval(() => {
      setText(formatRemaining(expiry))
    }, COUNTDOWN_TICK_MS)
    return () => {
      clearInterval(timer)
    }
  }, [expiry])

  return text
}
