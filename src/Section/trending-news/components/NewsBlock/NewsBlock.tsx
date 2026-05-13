'use client'

import { memo, useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import Stack from '@mui/material/Stack'
import type { NewsCluster } from '@/types'
import NewsBlockHeader from './NewsBlockHeader/NewsBlockHeader'
import NewsItem from '../NewsItem/NewsItem'
import styles from './NewsBlock.module.css'

interface Props {
  readonly cluster: NewsCluster
  readonly defaultExpanded?: boolean
}

const COLLAPSE_DURATION_MS = 200

export default memo(({
  cluster,
  defaultExpanded = false,
}: Props): JSX.Element => {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const handleToggle = useCallback((): void => {
    setExpanded((prev) => !prev)
  }, [])

  return (
    <Box className={styles.block} data-heat={cluster.heat}>
      <NewsBlockHeader cluster={cluster} expanded={expanded} onToggle={handleToggle} />
      <Collapse in={expanded} timeout={COLLAPSE_DURATION_MS} unmountOnExit>
        <Stack className={styles.list}>
          {cluster.articles.map((article) => (
            <NewsItem key={article.url} article={article} />
          ))}
        </Stack>
      </Collapse>
    </Box>
  )
})
