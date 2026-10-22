import type { BrandConfig, BrandId } from '@/types'
import DashboardOverview from '../DashboardOverview/DashboardOverview'

interface Props {
  readonly brand: BrandConfig & { readonly id: BrandId }
}

export default function BrandDashboard({ brand }: Props): JSX.Element {
  return <DashboardOverview brand={brand} />
}
