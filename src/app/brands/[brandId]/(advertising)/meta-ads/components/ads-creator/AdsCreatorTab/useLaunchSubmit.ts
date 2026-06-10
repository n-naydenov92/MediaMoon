'use client'

import { useCallback } from 'react'
import type { Market } from '@/types'
import { type CopyValue } from './CopyForm/CopyForm'
import { resolveCopy, type CopyOverride } from './perCreativeCopy'
import { adNameMapKey, buildPublishPayload } from './CreatorPane/helpers'
import type { CreativeSlot } from './creativeSlots'
import { type TargetingValue } from './CreatorPane/useTargetingData'
import type { UseLaunchQueueResult } from './useLaunchQueue'

interface Input {
  readonly canSubmit: boolean
  readonly targetMarket: Market | null
  readonly targeting: TargetingValue
  readonly slots: readonly CreativeSlot[]
  readonly copy: CopyValue
  readonly copyOverrides: ReadonlyMap<string, CopyOverride>
  readonly queue: UseLaunchQueueResult
  readonly clearForNextBatch: () => void
}

// Turn the draft into queued ads: one job per page × slot (uploaded files, library
// assets and duplicates alike), resolving each ad's name and per-creative copy, then
// clear what was just sent. Guards on canSubmit/targetMarket so a stray call can't
// enqueue an incomplete draft.
export function useLaunchSubmit({
  canSubmit,
  targetMarket,
  targeting,
  slots,
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
    const isSingleAd = targeting.pageIds.length * slots.length === 1
    const batchId = crypto.randomUUID()
    for (const pageId of targeting.pageIds) {
      for (const slot of slots) {
        const adCopy = resolveCopy(copy, copyOverrides.get(slot.key))
        const resolvedName = resolvedNames.get(adNameMapKey(pageId, slot.key))
        if (slot.source.kind === 'file') {
          const { file } = slot.source
          const name = resolvedName || copy.name || file.name
          queue.enqueue(
            buildPublishPayload({ targeting, copy: adCopy, pageId, name, isSinglePage }),
            file,
            batchId,
            adSetName,
          )
        } else {
          const { asset } = slot.source
          const name = resolvedName || (isSingleAd ? copy.name.trim() : '') || asset.name
          queue.enqueueAsset(
            buildPublishPayload({ targeting, copy: adCopy, pageId, name, isSinglePage }),
            asset,
            batchId,
            adSetName,
          )
        }
      }
    }
    clearForNextBatch()
  }, [canSubmit, clearForNextBatch, copy, copyOverrides, queue, slots, targeting, targetMarket])
}
