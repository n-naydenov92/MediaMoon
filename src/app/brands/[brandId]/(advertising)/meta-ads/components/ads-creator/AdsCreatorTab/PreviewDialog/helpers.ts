import type { Page } from '@/lib/gateways/MetaAdsGateway'
import type { FeedMedia } from '../AdFeedCard/helpers'

export interface Combo {
  readonly primary: string
  readonly headline: string
  readonly file: FeedMedia
  readonly page: Page | null
  readonly primaryIdx: number
  readonly headlineIdx: number
  readonly fileIdx: number
  readonly pageIdx: number
}

export function computeCombo(
  safeIndex: number,
  total: number,
  pages: readonly Page[],
  filePreviews: readonly FeedMedia[],
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
