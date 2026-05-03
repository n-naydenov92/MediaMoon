import { findBrandById } from '@/config/brands'
import ComingSoonPanel from '@/components/layout/ComingSoonPanel/ComingSoonPanel'
import MetaAdsTabs from './components/MetaAdsTabs'
import styles from './layout.module.css'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
  readonly children: React.ReactNode
}

export default async function MetaAdsLayout({ params, children }: Props): Promise<JSX.Element> {
  const { brandId } = await params
  const brand = findBrandById(brandId)
  if (!brand) {
    return <ComingSoonPanel moduleLabel="Meta Ads" brandLabel={brandId} />
  }
  return (
    <div className={styles.layout}>
      <MetaAdsTabs brandId={brand.id} />
      <div className={styles.content}>{children}</div>
    </div>
  )
}
