'use client'

import { memo } from 'react'
import Link from 'next/link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { RssArticle } from '@/types'
import { formatRelative } from '@/Section/trending-news/helpers'
import styles from './NewsItem.module.css'

interface Props {
  readonly article: RssArticle
}

/**
 * Single news article row — title, source label, and relative publish time.
 */
export default memo(function NewsItem({ article }: Props): JSX.Element {
  return (
    <Link
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
    >
      <Stack
        sx={(theme) => ({
          py: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          '&:last-child': { borderBottom: 'none' },
          '&:hover .news-item-title': { color: theme.palette.primary.main },
        })}
        spacing={1}
      >
        <Typography
          variant="body2"
          className="news-item-title"
          sx={{ color: 'text.primary', fontWeight: 500, transition: 'color 80ms ease-out' }}
        >
          {article.title}
        </Typography>
        <Stack direction="row" spacing={3} sx={{ color: 'text.secondary' }}>
          <Typography variant="caption">{article.source}</Typography>
          <Typography variant="caption">·</Typography>
          <Typography variant="caption">{formatRelative(article.pubDate)}</Typography>
        </Stack>
      </Stack>
    </Link>
  )
})
