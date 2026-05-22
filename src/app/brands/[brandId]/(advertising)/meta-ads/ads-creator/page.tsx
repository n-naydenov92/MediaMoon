import { findBrandById } from '@/config/brands'
import AdsCreatorTab from '../components/ads-creator/AdsCreatorTab/AdsCreatorTab'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
}

export default async function AdsCreatorPage({ params }: Props): Promise<JSX.Element | null> {
  const { brandId } = await params
  const brand = findBrandById(brandId)
  if (!brand) {
    return null
  }
  return <AdsCreatorTab brandId={brand.id} />
}
