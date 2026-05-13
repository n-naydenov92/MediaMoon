'use client'

import { createContext, useContext } from 'react'

interface MobileNavContextValue {
  readonly openMobileNav: () => void
  readonly desktopSidebarHidden: boolean
  readonly hideDesktopSidebar: () => void
  readonly showDesktopSidebar: () => void
}

const MobileNavContext = createContext<MobileNavContextValue | null>(null)

export const MobileNavProvider = MobileNavContext.Provider

export function useMobileNav(): MobileNavContextValue {
  const ctx = useContext(MobileNavContext)
  if (ctx === null) {
    throw new Error('useMobileNav must be used inside MobileNavProvider')
  }
  return ctx
}
