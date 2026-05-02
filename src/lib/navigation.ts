import type { BrandConfig, ModuleConfig } from '@/types'

export const BRAND_PATH_REGEX = /^\/brands\/([^/]+)/

export const MODULE_PATH_REGEX = /^\/brands\/[^/]+\/([^/?#]+)/

export const TOOLTIP_ENTER_DELAY_MS = 200

export function getActiveBrandId(pathname: string | null): string | null {
  return pathname?.match(BRAND_PATH_REGEX)?.[1] ?? null
}

export function getActiveModuleId(pathname: string | null): string | null {
  return pathname?.match(MODULE_PATH_REGEX)?.[1] ?? null
}

export function resolveActiveBrand(
  pathname: string | null,
  brands: readonly BrandConfig[],
): BrandConfig | null {
  const id = getActiveBrandId(pathname)
  if (!id) {
    return null
  }
  return brands.find((b) => b.id === id) ?? null
}

export function buildModuleHref(
  mod: ModuleConfig,
  brandId: string | null,
): string {
  if (mod.global) {
    return mod.path
  }
  if (brandId) {
    return `/brands/${brandId}/${mod.id}`
  }
  return '/brands'
}

export function isPathnameActive(
  pathname: string | null,
  href: string,
): boolean {
  if (pathname === null) {
    return false
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function findActiveChildModule(
  children: readonly ModuleConfig[] | undefined,
  brandId: string | null,
  pathname: string | null,
): ModuleConfig | null {
  if (!children || !brandId || !pathname) {
    return null
  }
  return (
    children.find((c) => isPathnameActive(pathname, `/brands/${brandId}/${c.id}`)) ??
    null
  )
}
