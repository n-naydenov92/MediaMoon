import Box from '@mui/material/Box'
import FacebookIcon from '@mui/icons-material/Facebook'
import GoogleIcon from '@mui/icons-material/Google'
import type { SpendChannel } from '@/types/dashboard'
import styles from './ChannelGlyph.module.css'

interface Props {
  readonly channel: SpendChannel
}

export default function ChannelGlyph({ channel }: Props): JSX.Element {
  if (channel === 'meta') {
    return <FacebookIcon className={styles.brandIcon} fontSize="small" />
  }
  if (channel === 'googleAds') {
    return <GoogleIcon className={styles.brandIcon} fontSize="small" />
  }
  return <Box component="span" className={styles.brandFallback} />
}
