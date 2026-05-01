'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import { ALL_MARKETS, type MarketSelection } from '@/lib/markets'
import { MARKET_LABELS } from '@/lib/marketLabels'
import MarketMenuItem from './MarketMenuItem'
import styles from './MarketSwitcher.module.css'

interface Props {
  readonly id: string
  readonly options: readonly MarketSelection[]
  readonly selected: MarketSelection
  readonly onSelect: (value: MarketSelection) => void
  readonly ariaLabel: string
}

const SEARCH_PLACEHOLDER = 'Find market…'

const MarketMenu = memo(function MarketMenu({
  id,
  options,
  selected,
  onSelect,
  ariaLabel,
}: Props): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const trimmed = query.trim().toLowerCase()
  const hasQuery = trimmed.length > 0

  const marketOptions = useMemo(
    () => options.filter((value) => value !== ALL_MARKETS),
    [options],
  )

  const filteredMarkets = useMemo(() => {
    if (!hasQuery) {
      return marketOptions
    }
    return marketOptions.filter((value) =>
      MARKET_LABELS[value].toLowerCase().includes(trimmed),
    )
  }, [marketOptions, hasQuery, trimmed])

  const handleQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setQuery(event.target.value)
  }, [])

  return (
    <div id={id} className={styles.menu}>
      <div className={styles.searchRow}>
        <SearchIcon className={styles.searchIcon} fontSize="small" />
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder={SEARCH_PLACEHOLDER}
          value={query}
          onChange={handleQueryChange}
          aria-label={SEARCH_PLACEHOLDER}
        />
        <span className={styles.escBadge} aria-hidden="true">Esc</span>
      </div>

      <ul role="listbox" aria-label={ariaLabel} className={styles.list}>
        {!hasQuery && (
          <>
            <MarketMenuItem
              value={ALL_MARKETS}
              isSelected={selected === ALL_MARKETS}
              onSelect={onSelect}
            />
            <li className={styles.separator} role="separator" />
          </>
        )}
        {filteredMarkets.map((value) => (
          <MarketMenuItem
            key={value}
            value={value}
            isSelected={selected === value}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  )
})

export default MarketMenu
