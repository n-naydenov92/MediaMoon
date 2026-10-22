import { redirect } from 'next/navigation'
import { getBrandContext } from '@/lib/tenancy'
import BrandDashboard from '@/Section/dashboard/BrandDashboard/BrandDashboard'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
}

export default async function BrandIndexPage({ params }: Props): Promise<JSX.Element> {
  const { brandId } = await params
  const ctx = await getBrandContext(brandId)
  if (!ctx) {
    redirect('/brands')
  }
  return <BrandDashboard brand={ctx.brand} />
}
