import { findBrandById } from '@/config/brands'
import OverviewTab from '../components/overview/OverviewTab'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
}

export default async function OverviewPage({ params }: Props): Promise<JSX.Element | null> {
  const { brandId } = await params
  const brand = findBrandById(brandId)
  if (!brand) {
    return null
  }
  return <OverviewTab brandId={brand.id} />
}
