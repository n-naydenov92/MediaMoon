import { redirect } from 'next/navigation'
import { findBrandById } from '@/config/brands'
import BrandDashboard from '@/Section/dashboard/BrandDashboard'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
}

export default async function BrandIndexPage({ params }: Props): Promise<JSX.Element> {
  const { brandId } = await params
  const brand = findBrandById(brandId)
  if (!brand) {
    redirect('/brands')
  }
  return <BrandDashboard brand={brand} />
}
