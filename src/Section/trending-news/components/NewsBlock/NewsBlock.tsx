'use client'

import { memo, useState } from 'react'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import Stack from '@mui/material/Stack'
import type { HeatLevel, NewsCluster } from '@/types'
import NewsBlockHeader from './NewsBlockHeader/NewsBlockHeader'
import NewsItem from '../NewsItem/NewsItem'

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

  const handleToggle = (): void => {
    setExpanded((prev) => !prev)
  }

  return (
    <Box
      sx={{
        borderLeft: 3,
        borderLeftColor: HEAT_LINE_COLOR[cluster.heat],
        pl: 4,
        py: 2,
      }}
    >
      <NewsBlockHeader
        cluster={cluster}
        expanded={expanded}
        onToggle={handleToggle}
      />
      <Collapse in={expanded} timeout={COLLAPSE_DURATION_MS} unmountOnExit>
        <Stack sx={{ mt: 3 }}>
          {cluster.articles.map((article) => (
            <NewsItem key={article.url} article={article} />
          ))}
        </Stack>
      </Collapse>
    </Box>
  )
})
