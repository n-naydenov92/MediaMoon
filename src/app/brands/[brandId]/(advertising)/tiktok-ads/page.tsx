import { getBrandContext } from '@/lib/tenancy'
import ComingSoonPanel from '@/components/layout/ComingSoonPanel/ComingSoonPanel'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
}

export default async function TikTokAdsPage({ params }: Props): Promise<JSX.Element> {
  const { brandId } = await params
  const ctx = await getBrandContext(brandId)
  return <ComingSoonPanel moduleLabel="TikTok Ads" brandLabel={ctx?.brand.label} />
}
