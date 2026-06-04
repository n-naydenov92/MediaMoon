import { useState } from 'react'
import { getTabDef, type ElementTabId, type SortDirection, type SortFieldId } from './config'

function initialSortByTab(): Record<ElementTabId, SortFieldId> {
  return {
    creatives: getTabDef('creatives').defaultSort,
    primary: getTabDef('primary').defaultSort,
    headline: getTabDef('headline').defaultSort,
    urls: getTabDef('urls').defaultSort,
  }
}

const INITIAL_SORT_DIR: Record<ElementTabId, SortDirection> = {
  creatives: 'desc',
  primary: 'desc',
  headline: 'desc',
  urls: 'desc',
}

export interface LibrarySort {
  readonly field: SortFieldId
  readonly direction: SortDirection
  readonly onChange: (field: SortFieldId) => void
}

// Per-tab sort field + direction. Picking the active field again flips direction;
// picking another field switches to it descending.
export function useLibrarySort(activeTab: ElementTabId): LibrarySort {
  const [sortByTab, setSortByTab] = useState<Record<ElementTabId, SortFieldId>>(initialSortByTab)
  const [sortDirByTab, setSortDirByTab] = useState<Record<ElementTabId, SortDirection>>(
    INITIAL_SORT_DIR,
  )

  function onChange(field: SortFieldId): void {
    if (field === sortByTab[activeTab]) {
      setSortDirByTab((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab] === 'desc' ? 'asc' : 'desc',
      }))
      return
    }
    setSortByTab((prev) => ({ ...prev, [activeTab]: field }))
    setSortDirByTab((prev) => ({ ...prev, [activeTab]: 'desc' }))
  }

  return { field: sortByTab[activeTab], direction: sortDirByTab[activeTab], onChange }
}
