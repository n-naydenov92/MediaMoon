export interface FilePreview {
  readonly url: string
  readonly name: string
  readonly isVideo: boolean
}

export interface Combo {
  readonly primary: string
  readonly headline: string
  readonly file: FilePreview
  readonly primaryIdx: number
  readonly headlineIdx: number
  readonly fileIdx: number
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
  filePreviews: readonly FilePreview[],
  filledHeadlines: readonly string[],
  filledPrimary: readonly string[],
): Combo | null {
  if (total === 0) return null
  const fileCount = filePreviews.length
  const headlineCount = filledHeadlines.length
  const fileIdx = safeIndex % fileCount
  const headlineIdx = Math.floor(safeIndex / fileCount) % headlineCount
  const primaryIdx = Math.floor(safeIndex / (fileCount * headlineCount))
  return {
    primary: filledPrimary[primaryIdx]!,
    headline: filledHeadlines[headlineIdx]!,
    file: filePreviews[fileIdx]!,
    primaryIdx,
    headlineIdx,
    fileIdx,
  }
}
