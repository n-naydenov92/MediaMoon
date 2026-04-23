'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { SourceCounts, SourceErrors } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'

interface Props {
  readonly sourceCounts: SourceCounts
  readonly sourceErrors: SourceErrors
}

const ERROR_TRUNCATE_LENGTH = 60

const SOURCES: ReadonlyArray<{ key: keyof SourceCounts; label: string }> = [
  { key: 'googleNewsRss', label: LABELS.sourceDebug.googleNewsRss },
  { key: 'searchApi', label: LABELS.sourceDebug.searchApi },
]

/**
 * Debug row showing raw article counts and errors per source before deduplication.
 */
export default memo(function SourceDebugRow({ sourceCounts, sourceErrors }: Props): JSX.Element {
  if (!sourceCounts) {
    return <></>
  }
  const total = Object.values(sourceCounts).reduce((s, n) => s + n, 0)

  return (
    <Box
      sx={{
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 1,
        px: 2,
        py: 1.5,
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
        {LABELS.sourceDebug.label(total)}
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={3}>
        {SOURCES.map(({ key, label }) => {
          const count = sourceCounts[key]
          const error = sourceErrors?.[key]
          const hasError = !!error
          const color = hasError ? 'error.main' : count > 0 ? 'success.main' : 'text.disabled'

          const content = (
            <Stack key={key} spacing={0} alignItems="flex-start">
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography variant="caption" sx={{ color }}>
                  {label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color }}
                >
                  {hasError ? '!' : count}
                </Typography>
              </Stack>
              {hasError && (
                <Typography
                  variant="caption"
                  sx={{ color: 'error.main', fontSize: '0.65rem', maxWidth: 200 }}
                  noWrap
                >
                  {error.length > ERROR_TRUNCATE_LENGTH
                    ? error.slice(0, ERROR_TRUNCATE_LENGTH) + '…'
                    : error}
                </Typography>
              )}
            </Stack>
          )

          return hasError ? (
            <Tooltip key={key} title={error} placement="top">
              <Box sx={{ cursor: 'help' }}>{content}</Box>
            </Tooltip>
          ) : (
            <Box key={key}>{content}</Box>
          )
        })}
      </Stack>
    </Box>
  )
})
