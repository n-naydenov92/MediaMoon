import type { BrandConfig, UserRole } from '@/types'
import type { BrandId } from './brands'

/**
 * Per-brand access control.
 *
 * Roles NOT present in this allowlist see every brand (current default for
 * admin/team and the topic-scoped roles). A role that IS listed is restricted
 * to exactly the brands in its array — used for single-brand operators.
 */
const ROLE_BRAND_ALLOWLIST: Partial<Record<UserRole, readonly BrandId[]>> = {
  bubullincas: ['bubullincas'],
}

export function isBrandRestrictedRole(role: UserRole): boolean {
  return role in ROLE_BRAND_ALLOWLIST
}

export function canRoleAccessBrand(role: UserRole, brandId: string): boolean {
  const allowed = ROLE_BRAND_ALLOWLIST[role]
  return allowed ? allowed.some((id) => id === brandId) : true
}

export function getAccessibleBrands(
  role: UserRole,
  brands: readonly BrandConfig[],
): readonly BrandConfig[] {
  return brands.filter((brand) => canRoleAccessBrand(role, brand.id))
}
