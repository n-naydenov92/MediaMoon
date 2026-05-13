'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import type { BrandConfig } from '@/types'
import { LABELS } from '@/components/layout/labels'
import BrandMenuItem from '../BrandMenuItem/BrandMenuItem'
import BrandMenuSearch from '../BrandMenuSearch/BrandMenuSearch'
import BrandMenuEmpty from '../BrandMenuEmpty/BrandMenuEmpty'
import styles from './BrandMenu.module.css'

interface Props {
  readonly id: string
  readonly brands: readonly BrandConfig[]
  readonly activeBrand: BrandConfig | null
  readonly onSelect: (brandId: string | null) => void
}

export default memo(function BrandMenu({
  id,
  brands,
  activeBrand,
  onSelect,
}: Props): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const trimmed = searchQuery.trim().toLowerCase()
  const hasQuery = trimmed.length > 0

  const filteredBrands = useMemo(() => {
    if (!hasQuery) {
      return brands
    }
    return brands.filter((b) => b.label.toLowerCase().includes(trimmed))
  }, [brands, trimmed, hasQuery])

  const hasMatches = filteredBrands.length > 0

  const handleQueryChange = useCallback((next: string): void => {
    setSearchQuery(next)
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <Box id={id} className={styles.menu}>
      <BrandMenuSearch
        value={searchQuery}
        inputRef={inputRef}
        onChange={handleQueryChange}
      />

      {hasMatches ? (
        <Box
          component="ul"
          role="listbox"
          aria-label={LABELS.sidebar.selectBrand}
          className={styles.list}
        >
          {!hasQuery && (
            <>
              <BrandMenuItem
                brand={null}
                isSelected={activeBrand === null}
                onSelect={() => onSelect(null)}
              />
              <Box component="li" className={styles.separator} role="separator" />
            </>
          )}
          {filteredBrands.map((brand) => (
            <BrandMenuItem
              key={brand.id}
              brand={brand}
              isSelected={activeBrand?.id === brand.id}
              onSelect={() => onSelect(brand.id)}
            />
          ))}
        </Box>
      ) : (
        <BrandMenuEmpty query={searchQuery} />
      )}
    </Box>
  )
})
