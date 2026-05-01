import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/currentUserRole'
import { getFirstAccessibleModule } from '@/config/modules'
import { BRAND_REGISTRY } from '@/config/brands'
import BrandsOverview from '@/Section/brands/BrandsOverview'

export default async function BrandsPage(): Promise<JSX.Element> {
  const role = await getCurrentUserRole()
  if (!role) redirect('/unauthorized')
  const first = getFirstAccessibleModule(role)
  if (!first) redirect('/unauthorized')
  return <BrandsOverview brands={BRAND_REGISTRY} firstModuleId={first.id} />
}
