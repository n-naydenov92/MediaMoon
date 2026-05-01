'use client'

import { memo, useCallback, useId, useMemo, useRef, useState } from 'react'
import { ALL_MARKETS, type MarketSelection } from '@/lib/markets'
import { MARKET_LABELS } from '@/lib/marketLabels'
import { useDismissPopover } from '@/components/layout/hooks/useDismissPopover'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import { useThemeMode } from '@/styles/useThemeMode'
import MarketSwitcherTrigger from './MarketSwitcherTrigger'
import MarketMenu from './MarketMenu'
import styles from './MarketSwitcher.module.css'

const MarketSwitcher = memo(function MarketSwitcher(): JSX.Element {
  const { markets, selectedMarket, setSelectedMarket } = useBrandShellContext()
  const { mode } = useThemeMode()
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const menuId = useId()

  const options = useMemo<readonly MarketSelection[]>(
    () => [ALL_MARKETS, ...markets],
    [markets],
  )

  const triggerLabel = MARKET_LABELS[selectedMarket]

  const dismiss = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleOpen = useCallback(() => {
    setIsOpen((s) => !s)
  }, [])

  const handleSelect = useCallback(
    (next: MarketSelection): void => {
      setSelectedMarket(next)
      setIsOpen(false)
    },
    [setSelectedMarket],
  )

  useDismissPopover(rootRef, isOpen, dismiss)

  return (
    <div className={styles.root} ref={rootRef} data-theme={mode}>
      <MarketSwitcherTrigger
        label={triggerLabel}
        menuId={menuId}
        isOpen={isOpen}
        onToggle={toggleOpen}
      />
      {isOpen && (
        <MarketMenu
          id={menuId}
          options={options}
          selected={selectedMarket}
          onSelect={handleSelect}
          ariaLabel={MARKET_LABELS.ALL}
        />
      )}
    </div>
  )
})

export default MarketSwitcher
