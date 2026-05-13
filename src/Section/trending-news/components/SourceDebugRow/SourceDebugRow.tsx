'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { SourceCounts, SourceErrors } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'
import styles from './SourceDebugRow.module.css'

interface Props {
  readonly sourceCounts: SourceCounts
  readonly sourceErrors: SourceErrors
}

type SourceState = 'error' | 'ok' | 'empty'

const ERROR_TRUNCATE_LENGTH = 60

const SOURCES: readonly { key: keyof SourceCounts; label: string }[] = [
  { key: 'googleNewsRss', label: LABELS.sourceDebug.googleNewsRss },
  { key: 'searchApi', label: LABELS.sourceDebug.searchApi },
]

function resolveState(hasError: boolean, count: number): SourceState {
  if (hasError) {
    return 'error'
  }
  return count > 0 ? 'ok' : 'empty'
}

export default memo(function SourceDebugRow({ sourceCounts, sourceErrors }: Props): JSX.Element {
  if (!sourceCounts) {
    // eslint-disable-next-line react/jsx-no-useless-fragment -- fragment kept for consistency
    return <></>
  }
  const total = Object.values(sourceCounts).reduce((s, n) => s + n, 0)

  return (
    <Box className={styles.container}>
      <Typography variant="caption" className={styles.summary}>
        {LABELS.sourceDebug.label(total)}
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={3}>
        {SOURCES.map(({ key, label }) => {
          const count = sourceCounts[key]
          const error = sourceErrors?.[key]
          const hasError = !!error
          const state = resolveState(hasError, count)

          const content = (
            <Stack key={key} spacing={0} alignItems="flex-start">
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography variant="caption" className={styles.label} data-state={state}>
                  {label}
                </Typography>
                <Typography variant="caption" className={styles.count} data-state={state}>
                  {hasError ? '!' : count}
                </Typography>
              </Stack>
              {hasError && (
                <Typography variant="caption" className={styles.errorText} noWrap>
                  {error.length > ERROR_TRUNCATE_LENGTH
                    ? `${error.slice(0, ERROR_TRUNCATE_LENGTH)}…`
                    : error}
                </Typography>
              )}
            </Stack>
          )

          return hasError ? (
            <Tooltip key={key} title={error} placement="top">
              <Box className={styles.helpCursor}>{content}</Box>
            </Tooltip>
          ) : (
            <Box key={key}>{content}</Box>
          )
        })}
      </Stack>
    </Box>
  )
})
