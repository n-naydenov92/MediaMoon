'use client'

import { memo } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import type { NewsCluster } from '@/types'
import NewsBlockHeader from './NewsBlockHeader/NewsBlockHeader'
import NewsItem from '../NewsItem/NewsItem'

interface Props {
  readonly cluster: NewsCluster
}

/**
 * Card displaying a news cluster — header with metrics and badges, plus a list of articles.
 */
export default memo(function NewsBlock({ cluster }: Props): JSX.Element {
  return (
    <Card>
      <CardContent>
        <Stack spacing={4}>
          <NewsBlockHeader cluster={cluster} />
          <Stack>
            {cluster.articles.map((article) => (
              <NewsItem key={article.url} article={article} />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
})
