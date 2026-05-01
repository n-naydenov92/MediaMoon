'use client'

import { useContext } from 'react'
import { BrandShellContext, type BrandShellContextValue } from './brandShellCtx'

export function useBrandShellContext(): BrandShellContextValue {
  const ctx = useContext(BrandShellContext)
  if (!ctx) {
    throw new Error(
      'useBrandShellContext must be used within a <BrandShellProvider>. ' +
        'Make sure your route is under /brands/[brandId]/...',
    )
  }
  return ctx
}
