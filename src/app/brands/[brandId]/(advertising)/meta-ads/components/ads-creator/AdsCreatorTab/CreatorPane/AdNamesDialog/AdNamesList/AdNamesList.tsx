'use client'

import { memo, useMemo } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import { templateAdName, type AdCombo, type AdNameTemplate } from '../../../adNaming'
import type { OverrideActions } from '../../../useAdNaming'
import AdNameRow from './AdNameRow/AdNameRow'
import { duplicateAdKeys, type AdNameListRow } from './helpers'
import styles from '../AdNamesDialog.module.css'

interface Props {
  readonly combos: readonly AdCombo[]
  readonly adsCount: number
  readonly template: AdNameTemplate
  readonly overrides: ReadonlyMap<string, string>
  readonly multiPage: boolean
  readonly emptyHint: string
  readonly actions: OverrideActions
  readonly onResetOverrides: () => void
}

export default memo(function AdNamesList({
  combos,
  adsCount,
  template,
  overrides,
  multiPage,
  emptyHint,
  actions,
  onResetOverrides,
}: Props): JSX.Element {
  const rows = useMemo<readonly AdNameListRow[]>(
    () => combos.map((combo) => ({ combo, templateName: templateAdName(combo, template) })),
    [combos, template],
  )
  const duplicateKeys = useMemo(() => duplicateAdKeys(rows, overrides), [rows, overrides])
  const hasEdits = combos.some((combo) => overrides.has(combo.key))

  return (
    <>
      <Box className={styles.listHeader}>
        <Typography component="span" variant="caption" color="text.disabled">
          Ad names
        </Typography>
        <Typography component="span" variant="caption" color="text.secondary" className={styles.listHeaderCount}>
          {adsCount}
        </Typography>
        {hasEdits && (
          <Tooltip title="Reset all to template">
            <IconButton
              size="small"
              aria-label="Reset all to template"
              className={styles.resetAllButton}
              onClick={onResetOverrides}
            >
              <RestartAltOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box className={styles.list}>
        {rows.length === 0 && (
          <Typography component="p" variant="body1" color="text.disabled" className={styles.emptyHint}>
            {emptyHint}
          </Typography>
        )}
        {rows.map(({ combo, templateName }) => (
          <AdNameRow
            key={combo.key}
            combo={combo}
            templateName={templateName}
            override={overrides.get(combo.key)}
            isDuplicate={duplicateKeys.has(combo.key)}
            multiPage={multiPage}
            actions={actions}
          />
        ))}
      </Box>
    </>
  )
})
