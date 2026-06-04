'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { CopyValue } from '../CopyForm/CopyForm'
import { fieldStatus, type CopyOverride, type OverridableField } from '../perCreativeCopy'
import styles from './CreativeStatusBadges.module.css'

interface FieldBadge {
  readonly key: OverridableField
  readonly label: string
  readonly name: string
}

const FIELDS: readonly FieldBadge[] = [
  { key: 'primaryTexts', label: 'P', name: 'Primary text' },
  { key: 'headlines', label: 'H', name: 'Headline' },
  { key: 'description', label: 'D', name: 'Description' },
  { key: 'url', label: 'U', name: 'URL' },
  { key: 'cta', label: 'C', name: 'Call to action' },
]

const STATUS_CLASS = {
  set: styles.set,
  empty: styles.empty,
  override: styles.override,
} as const

const STATUS_NOTE = {
  set: 'shared',
  empty: 'empty',
  override: 'overridden',
} as const

interface Props {
  readonly base: CopyValue
  readonly override?: CopyOverride
}

// Compact P·H·D·U·C row showing, per field, whether the creative inherits the
// shared copy (filled or empty) or carries its own overridden value.
export default memo(function CreativeStatusBadges({ base, override }: Props): JSX.Element {
  return (
    <Box className={styles.root} aria-label="Copy fields status">
      {FIELDS.map((field) => {
        const status = fieldStatus(base, override, field.key)
        return (
          <Typography
            key={field.key}
            component="span"
            variant="inherit"
            className={`${styles.badge} ${STATUS_CLASS[status]}`}
            title={`${field.name}: ${STATUS_NOTE[status]}`}
          >
            {field.label}
          </Typography>
        )
      })}
    </Box>
  )
})
