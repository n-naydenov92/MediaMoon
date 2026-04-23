import type { ModuleConfig, UserRole } from '@/types'

/**
 * Module Registry — single source of truth for all business modules.
 *
 * Adding a new module (e.g., "Shippings"):
 *   1. Add a new object to this array
 *   2. Create src/modules/<id>/ with components + config
 *   3. Create src/app/modules/<id>/page.tsx
 *   4. Create src/app/api/modules/<id>/route.ts (if needed)
 *   5. Add a new role in Clerk (if needed)
 *
 * Nothing else — existing code is not touched. (OCP)
 */
export const MODULE_REGISTRY: readonly ModuleConfig[] = [
  {
    id: 'trending-news',
    label: 'Trending News',
    icon: 'TrendingUp',
    path: '/modules/trending-news',
    roles: ['admin', 'team', 'stoichkov_only', 'shtonova_only'],
    color: '#6C63FF',
  },
  // Future example:
  // {
  //   id: 'shippings',
  //   label: 'Shippings',
  //   icon: 'LocalShipping',
  //   path: '/modules/shippings',
  //   roles: ['admin', 'team', 'shippings_operator'],
  //   color: '#10B981',
  // },
] as const

// ─── Query helpers (pure functions, no side effects) ─────────────────────────

export function getModulesForRole(role: UserRole): readonly ModuleConfig[] {
  return MODULE_REGISTRY.filter((m) => m.roles.includes(role))
}

export function getFirstAccessibleModule(role: UserRole): ModuleConfig | null {
  const [first] = getModulesForRole(role)
  return first ?? null
}

export function findModuleById(id: string): ModuleConfig | null {
  return MODULE_REGISTRY.find((m) => m.id === id) ?? null
}
