import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getBrandContext } from '@/lib/tenancy'
import { canRoleAccessBrand } from '@/config/brandAccess'
import { getCurrentUserRole } from '@/lib/currentUserRole'
import BrandShellProvider from '@/contexts/brandShell/BrandShellProvider'
import BrandTopbar from '@/components/layout/BrandTopbar/BrandTopbar'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
  readonly children: ReactNode
}

export default async function BrandLayout({ params, children }: Props): Promise<JSX.Element> {
  const { brandId } = await params
  const ctx = await getBrandContext(brandId)
  if (!ctx) {
    redirect('/brands')
  }

  const role = await getCurrentUserRole()
  if (!role) {
    redirect('/unauthorized')
  }
  if (!canRoleAccessBrand(role, ctx.brand.id)) {
    redirect('/brands')
  }

  return (
    <BrandShellProvider
      brandId={ctx.brand.id}
      markets={ctx.brand.markets}
      marketNames={ctx.marketNames}
      metaAccounts={ctx.metaAccounts}
    >
      <BrandTopbar />
      {children}
    </BrandShellProvider>
  )
}
