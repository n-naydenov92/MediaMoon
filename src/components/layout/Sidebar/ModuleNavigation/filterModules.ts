import type { ModuleConfig } from '@/types'

/**
 * Recursively filter modules + children by case-insensitive label match.
 * Parent match keeps all its children; otherwise children are filtered.
 */
export function filterModules(
  modules: readonly ModuleConfig[],
  query: string,
): readonly ModuleConfig[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) {
    return modules
  }

  return modules.flatMap((m) => {
    const parentMatches = m.label.toLowerCase().includes(trimmed)

    if (!m.children) {
      return parentMatches ? [m] : []
    }
    if (parentMatches) {
      return [m]
    }

    const matchingChildren = m.children.filter((c) =>
      c.label.toLowerCase().includes(trimmed),
    )
    if (matchingChildren.length === 0) {
      return []
    }
    return [{ ...m, children: matchingChildren }]
  })
}
