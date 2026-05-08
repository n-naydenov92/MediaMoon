'use client'

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import type { BrandId } from '@/config/brands'
import {
  DEFAULT_COLUMN_IDS,
  parseColumnIds,
  stringifyColumnIds,
  type ColumnId,
} from './columnSpecs'

const STORAGE_KEY_PREFIX = 'meta-ads.performance.cols'

export interface ColumnVisibility {
  readonly visibleColumns: readonly ColumnId[]
  readonly setVisibleColumns: Dispatch<SetStateAction<readonly ColumnId[]>>
}

export function useColumnVisibility(brandId: BrandId): ColumnVisibility {
  const storageKey = `${STORAGE_KEY_PREFIX}.${brandId}`

  const [visibleColumns, setVisibleColumns] = useState<readonly ColumnId[]>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_COLUMN_IDS
    }
    return parseColumnIds(window.localStorage.getItem(storageKey))
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (stringifyColumnIds(visibleColumns) === stringifyColumnIds(DEFAULT_COLUMN_IDS)) {
      window.localStorage.removeItem(storageKey)
    } else {
      window.localStorage.setItem(storageKey, stringifyColumnIds(visibleColumns))
    }
  }, [visibleColumns, storageKey])

  return { visibleColumns, setVisibleColumns }
}
