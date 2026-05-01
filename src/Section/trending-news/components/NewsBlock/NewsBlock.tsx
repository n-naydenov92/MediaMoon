'use client'

import { memo, useCallback, useState } from 'react'
import Collapse from '@mui/material/Collapse'
import Stack from '@mui/material/Stack'
import type { HeatLevel, NewsCluster } from '@/types'
import NewsBlockHeader from './NewsBlockHeader/NewsBlockHeader'
import NewsItem from '../NewsItem/NewsItem'
import styles from './NewsBlock.module.css'

interface Props {
  readonly cluster: NewsCluster
  readonly defaultExpanded?: boolean
}

const HEAT_LINE_COLOR: Record<HeatLevel, string> = {
  viral: '#F59E0B',
  hot: '#F97316',
  normal: '#64748B',
}

const COLLAPSE_DURATION_MS = 200

export default memo(function NewsBlock({
  cluster,
  defaultExpanded = false,
}: Props): JSX.Element {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const handleToggle = useCallback((): void => {
    setExpanded((prev) => !prev)
  }, [])

  return (
    <div
      className={styles.block}
      style={{ borderLeftColor: HEAT_LINE_COLOR[cluster.heat] }}
    >
      <NewsBlockHeader cluster={cluster} expanded={expanded} onToggle={handleToggle} />
      <Collapse in={expanded} timeout={COLLAPSE_DURATION_MS} unmountOnExit>
        <Stack className={styles.list}>
          {cluster.articles.map((article) => (
            <NewsItem key={article.url} article={article} />
          ))}
        </Stack>
      </Collapse>
    </div>
  )
})
