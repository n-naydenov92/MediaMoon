import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import styles from './SkeletonRows.module.css'

interface Props {
  readonly count?: number
  readonly height?: number
}

const DEFAULT_COUNT = 5
const DEFAULT_HEIGHT = 28

export default function SkeletonRows({
  count = DEFAULT_COUNT,
  height = DEFAULT_HEIGHT,
}: Props): JSX.Element {
  return (
    <Stack className={styles.skeletons}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="text" height={height} />
      ))}
    </Stack>
  )
}
