import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/currentUserRole'
import { BRAND_REGISTRY } from '@/config/brands'
import { getAccessibleBrands } from '@/config/brandAccess'
import BrandsOverview from '@/Section/brands/BrandsOverview/BrandsOverview'

export default async function BrandsPage(): Promise<JSX.Element> {
  const role = await getCurrentUserRole()
  if (!role) {
    redirect('/unauthorized')
  }
  return <BrandsOverview brands={getAccessibleBrands(role, BRAND_REGISTRY)} />
}
