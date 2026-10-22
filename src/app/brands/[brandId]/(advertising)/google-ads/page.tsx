import { getBrandContext } from '@/lib/tenancy'
import ComingSoonPanel from '@/components/layout/ComingSoonPanel/ComingSoonPanel'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
}

export default async function GoogleAdsPage({ params }: Props): Promise<JSX.Element> {
  const { brandId } = await params
  const ctx = await getBrandContext(brandId)
  return <ComingSoonPanel moduleLabel="Google Ads" brandLabel={ctx?.brand.label} />
}
