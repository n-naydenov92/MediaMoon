import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/currentUserRole'
import { listBrands } from '@/lib/tenancy'
import { getAccessibleBrands } from '@/config/brandAccess'
import BrandsOverview from '@/Section/brands/BrandsOverview/BrandsOverview'

export default async function BrandsPage(): Promise<JSX.Element> {
  const role = await getCurrentUserRole()
  if (!role) {
    redirect('/unauthorized')
  }
  return <BrandsOverview brands={getAccessibleBrands(role, await listBrands())} />
}
