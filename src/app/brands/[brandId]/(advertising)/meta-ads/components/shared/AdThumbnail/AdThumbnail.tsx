import Box from '@mui/material/Box'
import styles from './AdThumbnail.module.css'

interface Props {
  readonly src: string | null
  readonly alt: string
  readonly type: 'image' | 'video' | 'unknown'
  readonly size?: 'sm' | 'md'
}

export default function AdThumbnail({ src, alt, type, size = 'sm' }: Props): JSX.Element {
  if (!src) {
    return (
      <Box className={styles.placeholder} data-size={size} data-type={type} aria-label={alt}>
        {type === 'video' ? '▶' : '▣'}
      </Box>
    )
  }
  return (
    <Box className={styles.wrap} data-size={size}>
      <Box component="img" src={src} alt={alt} className={styles.img} loading="lazy" />
      {type === 'video' && <Box component="span" className={styles.badge}>▶</Box>}
    </Box>
  )
}
