import { findBrandById } from '@/config/brands'
import ComingSoonPanel from '@/components/layout/ComingSoonPanel/ComingSoonPanel'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
}

export default async function MetaAdsPage({ params }: Props): Promise<JSX.Element> {
  const { brandId } = await params
  const brand = findBrandById(brandId)
  return <ComingSoonPanel moduleLabel="Meta Ads" brandLabel={brand?.label} />
}
