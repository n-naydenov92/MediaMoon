const BRAND_PATH_PATTERN = /^\/brands\/[^/]+\/([^/?]+)/

export function extractModuleId(pathname: string): string | null {
  const match = pathname.match(BRAND_PATH_PATTERN)
  return match?.[1] ?? null
}
