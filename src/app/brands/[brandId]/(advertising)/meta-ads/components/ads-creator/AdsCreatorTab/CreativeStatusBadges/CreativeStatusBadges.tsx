'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
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
  missing: styles.missing,
} as const

const STATUS_NOTE = {
  set: 'shared',
  empty: 'empty',
  override: 'overridden',
  missing: 'empty · required',
} as const

interface Props {
  readonly baseFilled: ReadonlySet<OverridableField>
  readonly override?: CopyOverride
}

// Compact P·H·D·U·C row showing, per field, whether the creative inherits the
// shared copy (filled or empty) or carries its own overridden value.
export default memo(function CreativeStatusBadges({ baseFilled, override }: Props): JSX.Element {
  return (
    <Box className={styles.root} aria-label="Copy fields status">
      {FIELDS.map((field) => {
        const status = fieldStatus(baseFilled, override, field.key)
        return (
          <Tooltip
            key={field.key}
            title={`${field.name}: ${STATUS_NOTE[status]}`}
            placement="top"
            disableInteractive
          >
            <Typography
              component="span"
              variant="inherit"
              className={`${styles.badge} ${STATUS_CLASS[status]}`}
            >
              {field.label}
            </Typography>
          </Tooltip>
        )
      })}
    </Box>
  )
})
