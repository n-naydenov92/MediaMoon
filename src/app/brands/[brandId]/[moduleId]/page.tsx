import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/currentUserRole'
import { findModuleById } from '@/config/modules'
import { findBrandById } from '@/config/brands'
import TrendingNewsDashboard from '@/Section/trending-news/components/TrendingNewsDashboard/TrendingNewsDashboard'

interface Props {
  readonly params: Promise<{ readonly brandId: string; readonly moduleId: string }>
}

function renderModule(moduleId: string, brandId: string): JSX.Element {
  switch (moduleId) {
    case 'trending-news':
      return <TrendingNewsDashboard brandId={brandId} />
    default:
      redirect('/unauthorized')
  }
}

export default async function BrandModulePage({ params }: Props): Promise<JSX.Element> {
  const { brandId, moduleId } = await params

  if (!findBrandById(brandId)) redirect('/brands')

  const role = await getCurrentUserRole()
  if (!role) redirect('/unauthorized')

  const mod = findModuleById(moduleId)
  if (!mod || !mod.roles.includes(role)) redirect('/unauthorized')

  return renderModule(moduleId, brandId)
}
