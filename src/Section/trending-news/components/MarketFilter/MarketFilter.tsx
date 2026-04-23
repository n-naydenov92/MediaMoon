'use client'

import { memo, type MouseEvent } from 'react'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import type { Market } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'

interface Props {
  readonly markets: readonly Market[]
  readonly active: Market
  readonly onChange: (market: Market) => void
}

/**
 * Exclusive toggle filter for switching between available markets on a topic tab.
 */
export default memo(function MarketFilter({ markets, active, onChange }: Props): JSX.Element | null {
  if (markets.length < 2) {
    return null
  }

  const handleChange = (_event: MouseEvent<HTMLElement>, value: Market | null): void => {
    if (!value) {
      return
    }
    onChange(value)
  }

  return (
    <ToggleButtonGroup
      value={active}
      exclusive
      onChange={handleChange}
      size="small"
      aria-label={LABELS.aria.marketFilter}
    >
      {markets.map((market) => (
        <ToggleButton key={market} value={market} sx={{ px: 4 }}>
          {LABELS.markets[market]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
})
