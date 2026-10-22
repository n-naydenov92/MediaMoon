import { getBrandContext } from '@/lib/tenancy'
import AdsCreatorTab from '../components/ads-creator/AdsCreatorTab/AdsCreatorTab'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
}

export default async function AdsCreatorPage({ params }: Props): Promise<JSX.Element | null> {
  const { brandId } = await params
  const ctx = await getBrandContext(brandId)
  if (!ctx) {
    return null
  }
  return <AdsCreatorTab brandId={ctx.brand.id} />
}
