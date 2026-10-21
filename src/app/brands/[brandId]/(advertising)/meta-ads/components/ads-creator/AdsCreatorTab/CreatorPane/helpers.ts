import type { PublishPayload } from '../../launchPipeline/mediaUpload'
import type { CopyValue } from '../CopyForm/CopyForm'
import type { TargetingValue } from './useTargetingData'

// The five creation steps, in display order. The accordion and completion state key
// off this single list.
export const STEP_IDS = ['account', 'campaign', 'profiles', 'files', 'copy'] as const
export type StepId = typeof STEP_IDS[number]
export type Completion = Readonly<Record<StepId, boolean>>

// Display labels for each step — the single source for the accordion titles and the
// PublishBar's "finish setup" chips, so adding a step touches only STEP_IDS + this map.
export const STEP_LABELS: Record<StepId, string> = {
  account: 'Account',
  campaign: 'Campaign',
  profiles: 'Profiles',
  files: 'Files',
  copy: 'Copy',
}

export function firstIncomplete(c: Completion): StepId | null {
  return STEP_IDS.find((id) => !c[id]) ?? null
}

// Stable identity for a File across re-renders (the FilePicker list key uses
// name+index, which is fine for React but reorders break it for naming state).
export function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`
}

// Immutable Map set/delete — `null` removes the key. Replaces the
// `new Map(prev); set/delete; onChange(next)` pattern repeated across naming UI.
export function mapWith<K, V>(map: ReadonlyMap<K, V>, key: K, value: V | null): Map<K, V> {
  const next = new Map(map)
  if (value === null) {
    next.delete(key)
  } else {
    next.set(key, value)
  }
  return next
}

interface BuildPublishPayloadInput {
  readonly targeting: TargetingValue
  readonly copy: CopyValue
  readonly pageId: string
  readonly name: string
  readonly isSinglePage: boolean
}

// Single page keeps its explicit Instagram actor; multi-page lets the backend
// resolve each page's linked IG account.
export function buildPublishPayload({
  targeting,
  copy,
  pageId,
  name,
  isSinglePage,
}: BuildPublishPayloadInput): PublishPayload {
  return {
    accountId: targeting.accountId,
    adSetId: targeting.adSetId,
    pageId,
    instagramId: isSinglePage ? targeting.instagramId : '',
    autoResolveInstagram: !isSinglePage,
    status: copy.activate ? 'ACTIVE' : 'PAUSED',
    copy: {
      name,
      headline: copy.headlines[0] ?? '',
      body: copy.primaryTexts[0] ?? '',
      description: copy.description,
      url: copy.url,
      cta: copy.cta,
    },
  }
}

export function canSubmitCreator(targeting: TargetingValue, creativeCount: number): boolean {
  return (
    creativeCount > 0
    && targeting.accountId !== ''
    && targeting.campaignId !== ''
    && targeting.adSetId !== ''
    && targeting.pageIds.length > 0
  )
}
