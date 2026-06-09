'use client'

import { useCallback } from 'react'
import type { Market } from '@/types'
import { type AssetCreative } from './assetCreative'
import { type CopyValue } from './CopyForm/CopyForm'
import { creativeKey, resolveCopy, type CopyOverride } from './perCreativeCopy'
import { adKeyCombos, adNameMapKey, buildPublishPayload } from './CreatorPane/helpers'
import { type TargetingValue } from './CreatorPane/useTargetingData'
import type { UseLaunchQueueResult } from './useLaunchQueue'

interface Input {
  readonly canSubmit: boolean
  readonly targetMarket: Market | null
  readonly targeting: TargetingValue
  readonly files: readonly File[]
  readonly assets: readonly AssetCreative[]
  readonly copy: CopyValue
  readonly copyOverrides: ReadonlyMap<string, CopyOverride>
  readonly queue: UseLaunchQueueResult
  readonly clearForNextBatch: () => void
}

// Turn the draft into queued ads: one job per page × creative (uploaded files and
// library assets alike), resolving each ad's name and per-creative copy, then clear
// what was just sent. Guards on canSubmit/targetMarket so a stray call can't enqueue
// an incomplete draft.
export function useLaunchSubmit({
  canSubmit,
  targetMarket,
  targeting,
  files,
  assets,
  copy,
  copyOverrides,
  queue,
  clearForNextBatch,
}: Input): (resolvedNames: ReadonlyMap<string, string>, adSetName: string) => void {
  return useCallback((resolvedNames: ReadonlyMap<string, string>, adSetName: string) => {
    if (!canSubmit || !targetMarket) {
      return
    }
    const isSinglePage = targeting.pageIds.length === 1
    const isSingleAd = targeting.pageIds.length * (files.length + assets.length) === 1
    const batchId = crypto.randomUUID()
    for (const { pageId, file, key } of adKeyCombos(targeting.pageIds, files)) {
      const name = resolvedNames.get(key) || copy.name || file.name
      const adCopy = resolveCopy(copy, copyOverrides.get(creativeKey(file)))
      queue.enqueue(buildPublishPayload({ targeting, copy: adCopy, pageId, name, isSinglePage }), file, batchId, adSetName)
    }
    for (const pageId of targeting.pageIds) {
      for (const asset of assets) {
        const name = resolvedNames.get(adNameMapKey(pageId, asset.assetKey))
          || (isSingleAd ? copy.name.trim() : '')
          || asset.name
        const adCopy = resolveCopy(copy, copyOverrides.get(asset.assetKey))
        queue.enqueueAsset(
          buildPublishPayload({ targeting, copy: adCopy, pageId, name, isSinglePage }),
          asset,
          batchId,
          adSetName,
        )
      }
    }
    clearForNextBatch()
  }, [assets, canSubmit, clearForNextBatch, copy, copyOverrides, files, queue, targeting, targetMarket])
}
