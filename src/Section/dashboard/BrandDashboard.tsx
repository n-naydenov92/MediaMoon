import type { BrandId } from '@/config/brands'
import type { BrandConfig } from '@/types'
import DashboardOverview from './DashboardOverview'

interface Props {
  readonly brand: BrandConfig & { readonly id: BrandId }
}

export default function BrandDashboard({ brand }: Props): JSX.Element {
  return <DashboardOverview brand={brand} />
}
