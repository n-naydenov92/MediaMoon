import { readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { API_RULES, firstAccessiblePage, type ApiRoute } from './policy'

const API_ROOT = 'src/app/api'
const ROUTE_FILE = /(^|[\\/])route\.ts$/
const VIEW_ROUTES: readonly ApiRoute[] = ['meta-ads/summary', 'meta-ads/ads', 'meta-ads/insights']

function apiRoutes(): readonly string[] {
  return readdirSync(API_ROOT, { recursive: true, encoding: 'utf8' })
    .filter((file) => ROUTE_FILE.test(file))
    .map((file) => file.replace(ROUTE_FILE, '').replaceAll('\\', '/'))
}

describe('API_RULES', () => {
  it('has a rule for every API route, and no rule for a route that is gone', () => {
    expect(apiRoutes().toSorted()).toEqual(Object.keys(API_RULES).toSorted())
  })

  it('guards the dashboard data with dashboard.view', () => {
    expect(API_RULES['brands/dashboard/summary']).toEqual(['dashboard.view'])
    expect(API_RULES['brands/dashboard/products']).toEqual(['dashboard.view'])
  })

  it('opens the creative preview to anyone who sees a Meta page', () => {
    expect(API_RULES['meta-ads/insights']).toEqual([
      'meta-ads.overview.view',
      'meta-ads.performance.view',
      'meta-ads.creator.use',
    ])
  })

  it('puts every other Meta route behind Ads Creator access', () => {
    const creatorRoutes = Object.entries(API_RULES).filter(
      ([route]) => route.startsWith('meta-ads/') && !VIEW_ROUTES.some((viewRoute) => viewRoute === route),
    )
    creatorRoutes.forEach(([, permissions]) => {
      expect(permissions).toEqual(['meta-ads.creator.use'])
    })
  })
})

describe('firstAccessiblePage', () => {
  it('opens a brand on its dashboard for someone who may see it', () => {
    expect(firstAccessiblePage(['dashboard.view', 'meta-ads.overview.view'], ['META'])).toBe('')
  })

  it('opens on the first Meta page held, as Performance does for analysts today', () => {
    expect(firstAccessiblePage(['meta-ads.performance.view'], ['META'])).toBe('meta-ads/performance')
  })

  it('skips pages of a module the brand has no integration for', () => {
    expect(firstAccessiblePage(['meta-ads.overview.view', 'google-ads.view'], ['GOOGLE_ADS'])).toBe('google-ads')
  })

  it('finds no page for someone who holds nothing in the brand', () => {
    expect(firstAccessiblePage([], ['META', 'GOOGLE_ADS'])).toBeNull()
  })
})
