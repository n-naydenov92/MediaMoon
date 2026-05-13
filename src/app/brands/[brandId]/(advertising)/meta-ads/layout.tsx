import Box from '@mui/material/Box'
import { findBrandById } from '@/config/brands'
import ComingSoonPanel from '@/components/layout/ComingSoonPanel/ComingSoonPanel'
import CreativePreviewProvider from './components/shared/CreativePreview/CreativePreviewProvider/CreativePreviewProvider'
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
      <Box className={styles.layout}>
        <Box className={styles.content}>{children}</Box>
      </Box>
    </CreativePreviewProvider>
  )
}
