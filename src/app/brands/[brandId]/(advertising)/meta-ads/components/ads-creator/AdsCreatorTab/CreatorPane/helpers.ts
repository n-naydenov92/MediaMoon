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
}

export const EMPTY_AD_NAME_TAGS: AdNameTags = { product: '', creativeInfo: '', textType: '' }

// The free fields the operator overwrites in the generated name string.
const PLACEHOLDER_PARTS = ['Product', 'CreativeInfo', 'TextType'] as const

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
