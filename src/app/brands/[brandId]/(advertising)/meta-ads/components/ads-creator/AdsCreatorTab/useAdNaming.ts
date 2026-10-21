'use client'

import { useEffect, useMemo, useReducer } from 'react'
import {
  EMPTY_AD_NAMING,
  adNameMapKey,
  adNamingReducer,
  type AdNameTags,
  type AdNaming,
  type NamingMode,
} from './adNaming'

export interface AdNamingActions {
  readonly setMode: (mode: NamingMode) => void
  readonly setTag: (field: keyof AdNameTags, value: string) => void
  readonly setCustomName: (value: string) => void
  readonly setPageToken: (pageId: string, value: string) => void
  readonly setOverride: (key: string, value: string, templateName: string) => void
  readonly commitOverride: (key: string, templateName: string) => void
  readonly resetOverride: (key: string) => void
  readonly resetOverrides: () => void
  readonly clear: () => void
}

// What an editable ad-name field needs — a narrow view of the actions, so the field
// doesn't depend on the template/page-token controls it never calls.
export type OverrideActions = Pick<AdNamingActions, 'setOverride' | 'commitOverride' | 'resetOverride'>

interface AdNamingState {
  readonly naming: AdNaming
  readonly actions: AdNamingActions
}

// Owns the ad-naming inputs for the draft. The actions wrap `dispatch`, which React
// keeps stable, so every handler handed to the memoized naming rows is stable too.
export function useAdNaming(pageIds: readonly string[], slotKeys: readonly string[]): AdNamingState {
  const [naming, dispatch] = useReducer(adNamingReducer, EMPTY_AD_NAMING)

  const validPageIds = useMemo(() => new Set(pageIds), [pageIds])
  const validAdKeys = useMemo(
    () => new Set(pageIds.flatMap((pageId) => slotKeys.map((slotKey) => adNameMapKey(pageId, slotKey)))),
    [pageIds, slotKeys],
  )

  const actions = useMemo<AdNamingActions>(() => ({
    setMode: (mode) => dispatch({ type: 'setMode', mode }),
    setTag: (field, value) => dispatch({ type: 'setTag', field, value }),
    setCustomName: (value) => dispatch({ type: 'setCustomName', value }),
    setPageToken: (pageId, value) => dispatch({ type: 'setPageToken', pageId, value }),
    setOverride: (key, value, templateName) => dispatch({ type: 'setOverride', key, value, templateName }),
    commitOverride: (key, templateName) => dispatch({ type: 'commitOverride', key, templateName }),
    resetOverride: (key) => dispatch({ type: 'resetOverride', key }),
    resetOverrides: () => dispatch({ type: 'resetOverrides' }),
    clear: () => dispatch({ type: 'clear' }),
  }), [])

  useEffect(() => {
    dispatch({ type: 'prune', pageIds: validPageIds, adKeys: validAdKeys })
  }, [validPageIds, validAdKeys])

  return { naming, actions }
}
