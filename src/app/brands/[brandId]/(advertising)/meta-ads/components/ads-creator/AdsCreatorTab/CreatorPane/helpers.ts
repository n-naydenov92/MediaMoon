import type { Page } from '@/lib/gateways/MetaAdsGateway'
import type { PublishPayload } from '../../launchPipeline/mediaUpload'
import type { CopyValue } from '../CopyForm/CopyForm'
import { assetMediaToken, type AssetCreative } from '../assetCreative'
import type { TargetingValue } from './useTargetingData'

// The five creation steps, in display order. The accordion and completion state key
// off this single list.
export const STEP_IDS = ['account', 'campaign', 'profiles', 'files', 'copy'] as const
export type StepId = typeof STEP_IDS[number]
export type Completion = Readonly<Record<StepId, boolean>>

export function firstIncomplete(c: Completion): StepId | null {
  return STEP_IDS.find((id) => !c[id]) ?? null
}

// Stable identity for a File across re-renders (the FilePicker list key uses
// name+index, which is fine for React but reorders break it for naming state).
export function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`
}

export function mediaToken(file: File): 'Video' | 'IMG' {
  return file.type.startsWith('video/') ? 'Video' : 'IMG'
}

// Short page identifier from the page name initials (e.g. "Nedelya Shtonova" → "NS").
export function pageToken(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .filter(Boolean)
    .join('')
    .toUpperCase()
}

export function monthToken(now: Date): string {
  return now.toLocaleString('en-US', { month: 'short' })
}

export interface AdNameTags {
  readonly product: string
  readonly creativeInfo: string
  readonly textType: string
  readonly destination: string
}

export const EMPTY_AD_NAME_TAGS: AdNameTags = {
  product: '',
  creativeInfo: '',
  textType: '',
  destination: '',
}

// The free fields the operator overwrites in the generated name string. The
// destination (e.g. PP/HP) is appended after the page token, so it is its own
// trailing placeholder rather than part of this list.
const PLACEHOLDER_PARTS = ['Product', 'CreativeInfo', 'TextType'] as const
const DESTINATION_PLACEHOLDER = 'Dest'

// Free text shares the "-" field separator, so collapse internal whitespace to
// "-" and trim — keeps each authored value as one readable token.
function sanitizeTag(value: string): string {
  return value.trim().replace(/\s+/g, '-')
}

// A creative the operator can name per ad — a freshly uploaded file or a library
// asset. Both reduce to a stable key, a display name, a media token, and (for
// assets) the descriptive name to use as the editable default.
export interface NameableCreative {
  readonly key: string
  readonly name: string
  readonly media: 'Video' | 'IMG'
  readonly baseName: string | null
}

export function fileNameable(file: File): NameableCreative {
  return { key: fileKey(file), name: file.name, media: mediaToken(file), baseName: null }
}

export function assetNameable(asset: AssetCreative): NameableCreative {
  return { key: asset.assetKey, name: asset.name, media: assetMediaToken(asset), baseName: asset.name }
}

// The pre-filled, editable default each ad shows. Library assets already carry a
// descriptive name, so they default to it (with the page token appended to keep
// per-page ads distinct). Uploaded files get the structured placeholder skeleton
// {Media}-{Month}-Product-CreativeInfo-TextType[-{Page}]-Dest. `pageTok` is the
// already-resolved page token (custom or auto), or '' to omit.
export function buildAutoAdName(
  creative: NameableCreative,
  pageTok: string,
  now: Date = new Date(),
): string {
  if (creative.baseName !== null) {
    return pageTok ? `${creative.baseName}-${pageTok}` : creative.baseName
  }
  return [
    creative.media,
    monthToken(now),
    ...PLACEHOLDER_PARTS,
    pageTok,
    DESTINATION_PLACEHOLDER,
  ]
    .filter(Boolean)
    .join('-')
}

// Same structured shape, but from explicit bulk tag values; empty tags are dropped.
export function buildAdNameFromTags(
  creative: NameableCreative,
  pageTok: string,
  tags: AdNameTags,
  now: Date = new Date(),
): string {
  return [
    creative.media,
    monthToken(now),
    sanitizeTag(tags.product),
    sanitizeTag(tags.creativeInfo),
    sanitizeTag(tags.textType),
    pageTok,
    sanitizeTag(tags.destination),
  ]
    .filter(Boolean)
    .join('-')
}

// Custom page token if the operator touched the field (even to empty — page
// naming is optional), else the auto initials.
export function resolvePageToken(
  pageTokens: ReadonlyMap<string, string>,
  pageId: string,
  pageName: string,
): string {
  return pageTokens.has(pageId) ? (pageTokens.get(pageId) ?? '') : pageToken(pageName)
}

export function adNameMapKey(pageId: string, creativeKey: string): string {
  return `${pageId}::${creativeKey}`
}

// Swap the page-token segment in a built name when the page token changes,
// preserving any trailing destination segment (the name is `…-{page}` or
// `…-{page}-{dest}`). An empty newTok drops the page segment but keeps the tail.
// Returns the name untouched when the old token isn't present — manual edits and
// names from other pages are left alone.
export function restampPageToken(name: string, oldTok: string, newTok: string): string {
  if (!oldTok) {
    return name
  }
  if (name.endsWith(`-${oldTok}`)) {
    const base = name.slice(0, -(oldTok.length + 1))
    return newTok ? `${base}-${newTok}` : base
  }
  const marker = `-${oldTok}-`
  const idx = name.lastIndexOf(marker)
  if (idx === -1) {
    return name
  }
  const before = name.slice(0, idx)
  const tail = name.slice(idx + marker.length)
  return newTok ? `${before}-${newTok}-${tail}` : `${before}-${tail}`
}

// One ad per (page × creative). Each combo carries its resolved page token so
// callers that build names don't re-resolve it per creative.
export interface AdCombo {
  readonly page: Page
  readonly creative: NameableCreative
  readonly key: string
  readonly pageTok: string
}

export function adCombos(
  pages: readonly Page[],
  creatives: readonly NameableCreative[],
  pageTokens: ReadonlyMap<string, string>,
): readonly AdCombo[] {
  return pages.flatMap((page) => {
    const pageTok = resolvePageToken(pageTokens, page.id, page.name)
    return creatives.map((creative) => ({
      page,
      creative,
      key: adNameMapKey(page.id, creative.key),
      pageTok,
    }))
  })
}

// Id-keyed enumeration for the publish step, where names are already resolved and
// page objects aren't on hand — only the selected page ids.
export interface AdKeyCombo {
  readonly pageId: string
  readonly file: File
  readonly key: string
}

export function adKeyCombos(
  pageIds: readonly string[],
  files: readonly File[],
): readonly AdKeyCombo[] {
  return pageIds.flatMap(
    (pageId) => files.map((file) => ({ pageId, file, key: adNameMapKey(pageId, fileKey(file)) })),
  )
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

interface BuildAdNameMapInput {
  readonly pages: readonly Page[]
  readonly creatives: readonly NameableCreative[]
  readonly pageTokens: ReadonlyMap<string, string>
  readonly copy: CopyValue
  readonly adNames: ReadonlyMap<string, string>
  readonly isSingleAd: boolean
}

// Final name per ad: the operator's authored value (the shared field for a single
// ad, else the per-ad entry), falling back to the structured auto name.
export function buildAdNameMap({
  pages,
  creatives,
  pageTokens,
  copy,
  adNames,
  isSingleAd,
}: BuildAdNameMapInput): Map<string, string> {
  const names = new Map<string, string>()
  for (const { creative, key, pageTok } of adCombos(pages, creatives, pageTokens)) {
    const authored = (isSingleAd ? copy.name : adNames.get(key)) || ''
    names.set(key, authored || buildAutoAdName(creative, pageTok))
  }
  return names
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

export function canSubmitCreator(
  targeting: TargetingValue,
  copy: CopyValue,
  creativeCount: number,
): boolean {
  return (
    creativeCount > 0
    && targeting.accountId !== ''
    && targeting.campaignId !== ''
    && targeting.adSetId !== ''
    && targeting.pageIds.length > 0
    && (targeting.pageIds.length * creativeCount >= 2 || copy.name !== '')
  )
}
