'use client'

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import { applyLibraryText } from './CopyForm/VariationList/helpers'
import { MAX_COPY_VARIATIONS } from './copyFeatureFlags'
import { type CopyValue } from './CopyForm/CopyForm'
import {
  clearFieldOverrides,
  overrideCount,
  type CopyOverride,
  type OverridableField,
} from './perCreativeCopy'

export interface SharedConflict {
  readonly message: string
  readonly onlyShared: () => void
  readonly setOnAll: () => void
}

interface Input {
  readonly copyOverrides: ReadonlyMap<string, CopyOverride>
  readonly setCopy: Dispatch<SetStateAction<CopyValue>>
  readonly setCopyOverrides: Dispatch<SetStateAction<ReadonlyMap<string, CopyOverride>>>
}

export interface SharedCopyAdd {
  readonly sharedConflict: SharedConflict | null
  readonly handleAddPrimaryText: (value: string) => void
  readonly handleAddHeadline: (value: string) => void
  readonly handleAddUrl: (value: string) => void
  readonly closeConflict: () => void
}

// Library "Add" writes the shared copy. When some creatives carry their own value for
// that field, ask first (hybrid): keep the divergence and only update the rest, or
// force the value onto everyone by clearing those overrides.
export function useSharedCopyAdd({ copyOverrides, setCopy, setCopyOverrides }: Input): SharedCopyAdd {
  const [sharedConflict, setSharedConflict] = useState<SharedConflict | null>(null)

  const requestSharedAdd = useCallback((
    field: OverridableField,
    label: string,
    setShared: () => void,
  ) => {
    const customized = overrideCount(copyOverrides, field)
    if (customized === 0) {
      setShared()
      return
    }
    setSharedConflict({
      message: `${customized} ${customized === 1 ? 'creative uses' : 'creatives use'} a custom ${label}.`
        + ' Update the rest only, or set this on all of them?',
      onlyShared: () => {
        setShared()
        setSharedConflict(null)
      },
      setOnAll: () => {
        setShared()
        setCopyOverrides((prev) => clearFieldOverrides(prev, field))
        setSharedConflict(null)
      },
    })
  }, [copyOverrides, setCopyOverrides])

  const handleAddPrimaryText = useCallback((value: string) => {
    requestSharedAdd('primaryTexts', 'primary text', () => {
      setCopy((prev) => ({ ...prev, primaryTexts: applyLibraryText(prev.primaryTexts, value, MAX_COPY_VARIATIONS) }))
    })
  }, [requestSharedAdd, setCopy])

  const handleAddHeadline = useCallback((value: string) => {
    requestSharedAdd('headlines', 'headline', () => {
      setCopy((prev) => ({ ...prev, headlines: applyLibraryText(prev.headlines, value, MAX_COPY_VARIATIONS) }))
    })
  }, [requestSharedAdd, setCopy])

  const handleAddUrl = useCallback((value: string) => {
    requestSharedAdd('url', 'destination URL', () => {
      setCopy((prev) => ({ ...prev, url: value }))
    })
  }, [requestSharedAdd, setCopy])

  const closeConflict = useCallback(() => setSharedConflict(null), [])

  return { sharedConflict, handleAddPrimaryText, handleAddHeadline, handleAddUrl, closeConflict }
}
