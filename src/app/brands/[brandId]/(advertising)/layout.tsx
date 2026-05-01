import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { findBrandById } from '@/config/brands'
import { findModuleById } from '@/config/modules'
import { getCurrentUserRole } from '@/lib/currentUserRole'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
  readonly children: ReactNode
}

// TODO: wrap children in <AdvertisingProvider> once Meta/Google/TikTok
// dashboards land. The route group is intentionally shared so a single
// provider instance survives navigation between channels.
export default async function AdvertisingGroupLayout({
  params,
  children,
}: Props): Promise<JSX.Element> {
  const { brandId } = await params

  if (!findBrandById(brandId)) redirect('/brands')

  const role = await getCurrentUserRole()
  if (!role) redirect('/unauthorized')

  const advertising = findModuleById('advertising')
  if (!advertising || !advertising.roles.includes(role)) {
    redirect('/unauthorized')
  }

  return <>{children}</>
}
