import type { BrandConfig, UserRole } from '@/types'
import { isBrandId, type BrandId } from './brands'

/**
 * Per-brand access control. A role may see a brand only when BOTH sides agree:
 *
 * - Role side: roles NOT in `ROLE_BRAND_ALLOWLIST` see every brand; a listed
 *   role is restricted to exactly the brands in its array (single-brand operators).
 * - Brand side: brands NOT in `BRAND_ROLE_ALLOWLIST` are visible to every role;
 *   a listed brand is visible ONLY to the roles in its array (private brands).
 */
const ROLE_BRAND_ALLOWLIST: Partial<Record<UserRole, readonly BrandId[]>> = {
  bubullincas: ['bubullincas'],
}

const BRAND_ROLE_ALLOWLIST: Partial<Record<BrandId, readonly UserRole[]>> = {
  bubullincas: ['admin', 'bubullincas'],
}

export function canRoleAccessBrand(role: UserRole, brandId: string): boolean {
  return roleAllowsBrand(role, brandId) && brandAllowsRole(brandId, role)
}

function roleAllowsBrand(role: UserRole, brandId: string): boolean {
  const allowed = ROLE_BRAND_ALLOWLIST[role]
  return allowed ? allowed.some((id) => id === brandId) : true
}

function brandAllowsRole(brandId: string, role: UserRole): boolean {
  if (!isBrandId(brandId)) {
    return true
  }
  const allowed = BRAND_ROLE_ALLOWLIST[brandId]
  return allowed ? allowed.includes(role) : true
}

export function getAccessibleBrands(
  role: UserRole,
  brands: readonly BrandConfig[],
): readonly BrandConfig[] {
  return brands.filter((brand) => canRoleAccessBrand(role, brand.id))
}
