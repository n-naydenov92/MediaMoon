import { findBrandById } from '@/config/brands'
import ComingSoonPanel from '@/components/layout/ComingSoonPanel/ComingSoonPanel'
import MetaAdsView from './components/MetaAdsView'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
}

export default async function MetaAdsPage({ params }: Props): Promise<JSX.Element> {
  const { brandId } = await params
  const brand = findBrandById(brandId)
  if (!brand) {
    return <ComingSoonPanel moduleLabel="Meta Ads" brandLabel={brandId} />
  }
  return <MetaAdsView brandId={brand.id} />
}
