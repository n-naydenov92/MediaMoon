import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { findBrandById } from '@/config/brands'
import BrandShellProvider from '@/contexts/brandShell/BrandShellProvider'
import BrandTopbar from '@/components/layout/BrandTopbar/BrandTopbar'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
  readonly children: ReactNode
}

export default async function BrandLayout({ params, children }: Props): Promise<JSX.Element> {
  const { brandId } = await params
  const brand = findBrandById(brandId)
  if (!brand) {
    redirect('/brands')
  }

  return (
    <BrandShellProvider brandId={brand.id} markets={brand.markets}>
      <BrandTopbar />
      {children}
    </BrandShellProvider>
  )
}
