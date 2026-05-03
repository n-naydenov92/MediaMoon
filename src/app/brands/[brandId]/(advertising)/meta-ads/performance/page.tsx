import { findBrandById } from '@/config/brands'
import MetaAdsView from '../components/MetaAdsView'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
}

export default async function AdsPerformancePage({ params }: Props): Promise<JSX.Element | null> {
  const { brandId } = await params
  const brand = findBrandById(brandId)
  if (!brand) {
    return null
  }
  return <MetaAdsView brandId={brand.id} />
}
