const AUTH_ROUTE_PREFIXES = ['/sign-in', '/sign-up', '/sso-callback'] as const

export function isAuthPathname(pathname: string | null): boolean {
  if (pathname === null) {
    return false
  }
  return AUTH_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
