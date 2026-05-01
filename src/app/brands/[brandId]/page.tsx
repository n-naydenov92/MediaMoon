import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/currentUserRole'
import { getFirstAccessibleModule } from '@/config/modules'
import { findBrandById } from '@/config/brands'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
}

export default async function BrandIndexPage({ params }: Props): Promise<never> {
  const { brandId } = await params
  if (!findBrandById(brandId)) redirect('/brands')
  const role = await getCurrentUserRole()
  if (!role) redirect('/unauthorized')
  const first = getFirstAccessibleModule(role)
  if (!first) redirect('/unauthorized')
  redirect(`/brands/${brandId}/${first.id}`)
}
