// A destination URL must be a real http(s) link with a dotted hostname —
// plain text like "abc" or a bare word is rejected so Meta never gets junk.
export function isValidDestinationUrl(raw: string): boolean {
  const trimmed = raw.trim()
  if (trimmed === '') {
    return false
  }
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false
    }
    return parsed.hostname.includes('.')
  } catch {
    return false
  }
}

const URL_FORMAT_HELP = 'Enter a full URL, e.g. https://example.com'

export interface FieldValidity {
  readonly error: boolean
  readonly helper: string
}

// `treatEmptyAsMissing`: the shared form passes "are there inheritors?"; the per-creative
// editor passes true (any empty resolved URL is missing). `helper` is ' ' when valid so
// the reserved helper line never shifts layout.
export function destinationUrlValidity(
  url: string,
  treatEmptyAsMissing: boolean,
  missingHelp: string,
): FieldValidity {
  const empty = url.trim() === ''
  const badFormat = !empty && !isValidDestinationUrl(url)
  const missing = empty && treatEmptyAsMissing
  let helper = ' '
  if (badFormat) {
    helper = URL_FORMAT_HELP
  } else if (missing) {
    helper = missingHelp
  }
  return { error: badFormat || missing, helper }
}
