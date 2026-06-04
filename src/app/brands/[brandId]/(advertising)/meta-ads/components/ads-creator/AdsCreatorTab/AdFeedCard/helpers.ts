export interface FeedMedia {
  readonly url: string
  readonly name: string
  readonly isVideo: boolean
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
