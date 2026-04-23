import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/currentUserRole'
import { findModuleById } from '@/config/modules'
import TrendingNewsDashboard from '@/Section/trending-news/components/TrendingNewsDashboard/TrendingNewsDashboard'

export default async function TrendingNewsPage(): Promise<JSX.Element> {
  const role = await getCurrentUserRole()
  if (!role) {
    redirect('/unauthorized')
  }
  const config = findModuleById('trending-news')
  if (!config || !config.roles.includes(role)) {
    redirect('/unauthorized')
  }
  return <TrendingNewsDashboard role={role} />
}
