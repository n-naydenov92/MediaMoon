'use client'

import { memo } from 'react'
import Link from 'next/link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ArticleOutlined from '@mui/icons-material/ArticleOutlined'
import type { RssArticle } from '@/types'
import { formatRelative } from '@/Section/trending-news/helpers'
import styles from './NewsItem.module.css'

interface Props {
  readonly article: RssArticle
}

export default memo(function NewsItem({ article }: Props): JSX.Element {
  return (
    <Link
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start" className={styles.row}>
        <ArticleOutlined fontSize="small" className={styles.icon} />
        <Stack spacing={1} className={styles.body}>
          <Typography variant="body2" className={`${styles.title} news-item-title`}>
            {article.title}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" className={styles.meta}>
            <Typography variant="caption">{article.source}</Typography>
            <Typography variant="caption">·</Typography>
            <Typography variant="caption" className={styles.metaTime}>
              {formatRelative(article.pubDate)}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Link>
  )
})
