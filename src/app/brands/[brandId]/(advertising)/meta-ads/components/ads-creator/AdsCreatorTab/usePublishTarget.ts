'use client'

import { useMemo } from 'react'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import { shareMetaConnection } from '@/lib/tenancy/selection'
import type { PublishTarget } from './assetCompat'

export function usePublishTarget(accountId: string): PublishTarget {
  const { metaAccounts } = useBrandShellContext()
  return useMemo<PublishTarget>(() => ({
    accountId,
    sharesConnectionWith: (sourceAccountId) => shareMetaConnection(metaAccounts, accountId, sourceAccountId),
  }), [metaAccounts, accountId])
}
