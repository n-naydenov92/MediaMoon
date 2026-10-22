import { getBrandContext } from '@/lib/tenancy'
import OverviewTab from '../components/overview/OverviewTab/OverviewTab'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
}

export default async function OverviewPage({ params }: Props): Promise<JSX.Element | null> {
  const { brandId } = await params
  const ctx = await getBrandContext(brandId)
  if (!ctx) {
    return null
  }
  return <OverviewTab brandId={ctx.brand.id} />
}
