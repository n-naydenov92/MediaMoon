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
      <Stack
        direction="row"
        spacing={2}
        alignItems="flex-start"
        sx={(theme) => ({
          py: 2,
          px: 2,
          borderRadius: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          '&:last-child': { borderBottom: 'none' },
          transition: 'background-color 80ms ease-out',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            '& .news-item-title': { color: theme.palette.primary.main },
          },
        })}
      >
        <ArticleOutlined
          fontSize="small"
          sx={{ color: 'text.secondary', flexShrink: 0, mt: 0.5 }}
        />
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            className="news-item-title"
            sx={{
              color: 'text.primary',
              fontWeight: 500,
              transition: 'color 80ms ease-out',
            }}
          >
            {article.title}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ color: 'text.secondary' }}
          >
            <Typography variant="caption">{article.source}</Typography>
            <Typography variant="caption">·</Typography>
            <Typography
              variant="caption"
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatRelative(article.pubDate)}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Link>
  )
})
