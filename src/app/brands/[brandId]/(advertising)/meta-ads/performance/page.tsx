import { getBrandContext } from '@/lib/tenancy'
import PerformanceTab from '../components/performance/PerformanceTab/PerformanceTab'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
}

export default async function AdsPerformancePage({ params }: Props): Promise<JSX.Element | null> {
  const { brandId } = await params
  const ctx = await getBrandContext(brandId)
  if (!ctx) {
    return null
  }
  return <PerformanceTab brandId={ctx.brand.id} />
}
