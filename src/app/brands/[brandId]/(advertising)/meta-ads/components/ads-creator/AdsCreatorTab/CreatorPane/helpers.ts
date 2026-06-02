import type { Page } from '@/lib/gateways/MetaAdsGateway'
import type { PublishPayload } from '../../launchPipeline/mediaUpload'
import type { CopyValue } from '../CopyForm/CopyForm'
import { isValidDestinationUrl } from '../CopyForm/helpers'
import type { TargetingValue } from './useTargetingData'

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

// {Media}-{Month}-Product-CreativeInfo-TextType[-{Page}] with placeholder words —
// the pre-filled, editable default each ad shows. `pageTok` is the already-resolved
// page token (custom or auto), or '' to omit.
export function buildAutoAdName(
  file: File,
  pageTok: string,
  now: Date = new Date(),
): string {
  return [
    mediaToken(file),
    monthToken(now),
    ...PLACEHOLDER_PARTS,
    pageTok,
    DESTINATION_PLACEHOLDER,
  ]
    .filter(Boolean)
    .join('-')
}

// Same shape, but from explicit bulk tag values; empty tags are dropped.
export function buildAdNameFromTags(
  file: File,
  pageTok: string,
  tags: AdNameTags,
  now: Date = new Date(),
): string {
  return [
    mediaToken(file),
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

export function adNameMapKey(pageId: string, file: File): string {
  return `${pageId}::${fileKey(file)}`
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

// One ad per (page × file). Each combo carries its resolved page token so callers
// that build names don't re-resolve it per file.
export interface AdCombo {
  readonly page: Page
  readonly file: File
  readonly key: string
  readonly pageTok: string
}

export function adCombos(
  pages: readonly Page[],
  files: readonly File[],
  pageTokens: ReadonlyMap<string, string>,
): readonly AdCombo[] {
  return pages.flatMap((page) => {
    const pageTok = resolvePageToken(pageTokens, page.id, page.name)
    return files.map((file) => ({ page, file, key: adNameMapKey(page.id, file), pageTok }))
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
  return pageIds.flatMap((pageId) => files.map((file) => ({ pageId, file, key: adNameMapKey(pageId, file) })))
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
  readonly files: readonly File[]
  readonly pageTokens: ReadonlyMap<string, string>
  readonly copy: CopyValue
  readonly adNames: ReadonlyMap<string, string>
  readonly isSingleAd: boolean
}

// Final name per ad: the operator's authored value (the shared field for a single
// ad, else the per-ad entry), falling back to the structured auto name.
export function buildAdNameMap({
  pages,
  files,
  pageTokens,
  copy,
  adNames,
  isSingleAd,
}: BuildAdNameMapInput): Map<string, string> {
  const names = new Map<string, string>()
  for (const { file, key, pageTok } of adCombos(pages, files, pageTokens)) {
    const authored = (isSingleAd ? copy.name : adNames.get(key)) || ''
    names.set(key, authored || buildAutoAdName(file, pageTok))
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
  files: readonly File[],
): boolean {
  return (
    files.length > 0
    && targeting.accountId !== ''
    && targeting.campaignId !== ''
    && targeting.adSetId !== ''
    && targeting.pageIds.length > 0
    && (targeting.pageIds.length * files.length >= 2 || copy.name !== '')
    && copy.headlines[0] !== ''
    && copy.primaryTexts[0] !== ''
    && isValidDestinationUrl(copy.url)
  )
}
