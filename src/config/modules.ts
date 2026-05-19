import type { ModuleConfig, UserRole } from '@/types'

/**
 * Module Registry — single source of truth for all business modules.
 *
 * Adding a new module (e.g., "Shippings"):
 *   1. Add a new object to this array
 *   2. Create src/Section/<id>/ with components + config
 *   3. Create src/app/brands/[brandId]/<id>/page.tsx (or extend the [moduleId] dispatcher)
 *   4. Create src/app/api/modules/<id>/route.ts (if needed)
 *   5. Add a new role in Clerk (if needed)
 *
 * Groups: a module can declare `children` to render as an expandable group in
 * the sidebar. The parent itself is not navigable — only its children link
 * out. Children are flattened by `flattenModules` for role lookups.
 */
export const MODULE_REGISTRY: readonly ModuleConfig[] = [
  {
    id: 'advertising',
    label: 'Advertising',
    icon: 'Campaign',
    path: '',
    roles: ['admin', 'team', 'creative_analyst'],
    color: '#F97316',
    children: [
      {
        id: 'meta-ads',
        label: 'Meta Ads',
        icon: 'Facebook',
        path: '/modules/meta-ads',
        roles: ['admin', 'team', 'creative_analyst'],
        color: '#1877F2',
      },
      {
        id: 'google-ads',
        label: 'Google Ads',
        icon: 'Google',
        path: '/modules/google-ads',
        roles: ['admin', 'team'],
        color: '#4285F4',
      },
    ],
  },
  {
    id: 'trending-news',
    label: 'Trending News',
    icon: 'TrendingUp',
    path: '/modules/trending-news',
    roles: ['admin', 'team', 'stoichkov_only', 'shtonova_only'],
    color: '#6C63FF',
  },
] as const

// ─── Query helpers (pure functions, no side effects) ─────────────────────────

export function flattenModules(
  modules: readonly ModuleConfig[],
): readonly ModuleConfig[] {
  return modules.flatMap((m) => (m.children ? [m, ...m.children] : [m]))
}

export function getModulesForRole(role: UserRole): readonly ModuleConfig[] {
  return MODULE_REGISTRY.flatMap((m) => {
    if (!m.children) {
      return m.roles.includes(role) ? [m] : []
    }
    const accessibleChildren = m.children.filter((c) => c.roles.includes(role))
    if (accessibleChildren.length === 0) {
      return []
    }
    return [{ ...m, children: accessibleChildren }]
  })
}

export function getFirstAccessibleModule(role: UserRole): ModuleConfig | null {
  for (const mod of MODULE_REGISTRY) {
    if (!mod.children) {
      if (mod.roles.includes(role)) return mod
      continue
    }
    const child = mod.children.find((c) => c.roles.includes(role))
    if (child) return child
  }
  return null
}

export function findModuleById(id: string): ModuleConfig | null {
  for (const mod of MODULE_REGISTRY) {
    if (mod.id === id) {
      return mod
    }
    if (mod.children) {
      const child = mod.children.find((c) => c.id === id)
      if (child) {
        return child
      }
    }
  }
  return null
}

/**
 * Returns the first navigable leaf in the registry.
 * If a top-level entry is a group (has children), descends into the first child.
 */
export function getFirstNavigableModule(
  modules: readonly ModuleConfig[],
): ModuleConfig | null {
  for (const mod of modules) {
    if (mod.children && mod.children.length > 0) {
      return mod.children[0] ?? null
    }
    if (mod.path) {
      return mod
    }
  }
  return null
}
