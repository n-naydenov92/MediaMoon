'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

interface MetaAdsHeaderContextValue {
  readonly actionSlot: ReactNode
  readonly setActionSlot: (node: ReactNode) => void
}

const MetaAdsHeaderContext = createContext<MetaAdsHeaderContextValue | null>(null)

export function MetaAdsHeaderProvider({ children }: { readonly children: ReactNode }): JSX.Element {
  const [actionSlot, setActionSlot] = useState<ReactNode>(null)
  const stableSetter = useCallback((node: ReactNode) => setActionSlot(node), [])
  return (
    <MetaAdsHeaderContext.Provider value={{ actionSlot, setActionSlot: stableSetter }}>
      {children}
    </MetaAdsHeaderContext.Provider>
  )
}

export function useMetaAdsHeaderAction(): ReactNode {
  const ctx = useContext(MetaAdsHeaderContext)
  if (!ctx) {
    throw new Error('useMetaAdsHeaderAction must be used inside MetaAdsHeaderProvider')
  }
  return ctx.actionSlot
}

export function useSetHeaderAction(node: ReactNode): void {
  const ctx = useContext(MetaAdsHeaderContext)
  if (!ctx) {
    throw new Error('useSetHeaderAction must be used inside MetaAdsHeaderProvider')
  }
  const { setActionSlot } = ctx
  useEffect(() => {
    setActionSlot(node)
    return () => setActionSlot(null)
  }, [node, setActionSlot])
}
