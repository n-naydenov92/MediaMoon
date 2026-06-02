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
