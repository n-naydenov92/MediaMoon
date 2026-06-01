import type { Page } from '@/lib/gateways/MetaAdsGateway'

export interface FilePreview {
  readonly url: string
  readonly name: string
  readonly isVideo: boolean
}

export interface Combo {
  readonly primary: string
  readonly headline: string
  readonly file: FilePreview
  readonly page: Page | null
  readonly primaryIdx: number
  readonly headlineIdx: number
  readonly fileIdx: number
  readonly pageIdx: number
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function initialOf(name: string): string {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed[0]!.toUpperCase() : '?'
}

export function computeCombo(
  safeIndex: number,
  total: number,
  pages: readonly Page[],
  filePreviews: readonly FilePreview[],
  filledHeadlines: readonly string[],
  filledPrimary: readonly string[],
): Combo | null {
  if (total === 0) return null
  const pageCount = Math.max(1, pages.length)
  const fileCount = filePreviews.length
  const headlineCount = filledHeadlines.length
  const pageIdx = safeIndex % pageCount
  const fileIdx = Math.floor(safeIndex / pageCount) % fileCount
  const headlineIdx = Math.floor(safeIndex / (pageCount * fileCount)) % headlineCount
  const primaryIdx = Math.floor(safeIndex / (pageCount * fileCount * headlineCount))
  return {
    primary: filledPrimary[primaryIdx]!,
    headline: filledHeadlines[headlineIdx]!,
    file: filePreviews[fileIdx]!,
    page: pages[pageIdx] ?? null,
    primaryIdx,
    headlineIdx,
    fileIdx,
    pageIdx,
  }
}
