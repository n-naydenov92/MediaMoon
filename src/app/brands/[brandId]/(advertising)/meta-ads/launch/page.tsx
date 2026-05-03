import { findBrandById } from '@/config/brands'
import LaunchAdsTab from '../components/launch/LaunchAdsTab'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
}

export default async function LaunchPage({ params }: Props): Promise<JSX.Element | null> {
  const { brandId } = await params
  const brand = findBrandById(brandId)
  if (!brand) {
    return null
  }
  return <LaunchAdsTab brandId={brand.id} />
}
