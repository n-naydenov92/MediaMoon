import { findBrandById } from '@/config/brands'
import ComingSoonPanel from '@/components/layout/ComingSoonPanel/ComingSoonPanel'
import CreativePreviewProvider from './components/shared/CreativePreview/CreativePreviewProvider'
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
    <CreativePreviewProvider>
      <div className={styles.layout}>
        <div className={styles.content}>{children}</div>
      </div>
    </CreativePreviewProvider>
  )
}
