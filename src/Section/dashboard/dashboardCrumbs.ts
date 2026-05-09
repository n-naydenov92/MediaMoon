import type { Crumb } from '@/components/layout/PageHeader'

export function buildDashboardCrumbs(brandLabel: string): readonly Crumb[] {
  return [{ label: brandLabel }, { label: 'Dashboard' }]
}
