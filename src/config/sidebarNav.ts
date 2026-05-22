import type { NavPanel, NavItem, UserRole } from '@/types'

const ROLES_ALL: readonly UserRole[] = ['admin', 'team', 'stoichkov_only', 'shtonova_only']
const ROLES_TEAM: readonly UserRole[] = ['admin', 'team']
const ROLES_ADS_PERFORMANCE: readonly UserRole[] = ['admin', 'team', 'creative_analyst']

const ADVERTISING_PANEL: NavPanel = {
  id: 'advertising',
  title: 'Advertising',
  sections: [
    {
      id: 'meta-ads',
      label: 'Meta Ads',
      items: [
        {
          kind: 'link',
          id: 'meta-ads-overview',
          label: 'Overview',
          icon: 'Dashboard',
          pathSuffix: 'meta-ads/overview',
          roles: ROLES_TEAM,
        },
        {
          kind: 'link',
          id: 'meta-ads-performance',
          label: 'Ads Performance',
          icon: 'BarChart',
          pathSuffix: 'meta-ads/performance',
          roles: ROLES_ADS_PERFORMANCE,
        },
        {
          kind: 'link',
          id: 'meta-ads-ads-creator',
          label: 'Ads Creator',
          icon: 'AddCircleOutline',
          pathSuffix: 'meta-ads/ads-creator',
          roles: ROLES_TEAM,
        },
        {
          kind: 'link',
          id: 'meta-ads-insights',
          label: 'Insights',
          icon: 'Lightbulb',
          pathSuffix: 'meta-ads/insights',
          roles: ROLES_TEAM,
          disabled: true,
        },
      ],
    },
    {
      id: 'google-ads',
      label: 'Google Ads',
      items: [
        {
          kind: 'link',
          id: 'google-ads-overview',
          label: 'Overview',
          icon: 'Dashboard',
          pathSuffix: 'google-ads',
          roles: ROLES_TEAM,
          disabled: true,
        },
      ],
    },
  ],
}

export const MAIN_PANEL: NavPanel = {
  id: 'main',
  title: '',
  sections: [
    {
      id: 'general',
      label: 'General',
      items: [
        {
          kind: 'link',
          id: 'dashboard',
          label: 'Dashboard',
          icon: 'SpaceDashboard',
          pathSuffix: '',
          roles: ROLES_ALL,
        },
      ],
    },
    {
      id: 'workspaces',
      label: '',
      items: [
        {
          kind: 'drilldown',
          id: 'advertising',
          label: 'Advertising',
          icon: 'Campaign',
          roles: ROLES_ADS_PERFORMANCE,
          panel: ADVERTISING_PANEL,
        },
      ],
    },
    {
      id: 'news',
      label: '',
      items: [
        {
          kind: 'link',
          id: 'trending-news',
          label: 'Trending News',
          icon: 'TrendingUp',
          pathSuffix: 'trending-news',
          roles: ROLES_ALL,
        },
      ],
    },
  ],
}

export function findActivePanelPath(
  pathname: string,
  brandId: string | null,
): readonly string[] {
  if (brandId === null) {
    return []
  }
  return walk(MAIN_PANEL, pathname, brandId, [])
}

function walk(
  panel: NavPanel,
  pathname: string,
  brandId: string,
  trail: readonly string[],
): readonly string[] {
  for (const section of panel.sections) {
    for (const item of section.items) {
      const next = matchItem(item, pathname, brandId, trail)
      if (next !== null) {
        return next
      }
    }
  }
  return []
}

function matchItem(
  item: NavItem,
  pathname: string,
  brandId: string,
  trail: readonly string[],
): readonly string[] | null {
  if (item.kind === 'link') {
    const href = buildHref(brandId, item.pathSuffix)
    return isHrefActive(pathname, href, item.pathSuffix) ? trail : null
  }
  return walk(item.panel, pathname, brandId, [...trail, item.id])
}

export function buildHref(brandId: string, pathSuffix: string): string {
  const base = `/brands/${brandId}`
  return pathSuffix === '' ? base : `${base}/${pathSuffix}`
}

export function isHrefActive(
  pathname: string,
  href: string,
  pathSuffix: string,
): boolean {
  if (pathSuffix === '') {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function findItem(panel: NavPanel, itemId: string): NavItem | null {
  for (const section of panel.sections) {
    for (const item of section.items) {
      if (item.id === itemId) {
        return item
      }
    }
  }
  return null
}

export function findPanelByTrail(trail: readonly string[]): NavPanel | null {
  let current: NavPanel = MAIN_PANEL
  for (const id of trail) {
    const item = findItem(current, id)
    if (item === null || item.kind !== 'drilldown') {
      return null
    }
    current = item.panel
  }
  return current
}
