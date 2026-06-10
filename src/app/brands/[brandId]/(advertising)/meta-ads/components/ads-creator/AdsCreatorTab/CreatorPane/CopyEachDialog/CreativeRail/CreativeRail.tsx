'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  REQUIRED_FIELDS,
  fieldStatus,
  type CopyOverride,
  type OverridableField,
} from '../../../perCreativeCopy'
import CreativeStatusBadges from '../../../CreativeStatusBadges/CreativeStatusBadges'
import type { CreativeItem } from '../helpers'
import styles from './CreativeRail.module.css'

interface Props {
  readonly items: readonly CreativeItem[]
  readonly baseFilled: ReadonlySet<OverridableField>
  readonly overrides: ReadonlyMap<string, CopyOverride>
  readonly activeKey: string | null
  readonly checkedKeys: ReadonlySet<string>
  readonly onSelect: (key: string) => void
  readonly onToggleCheck: (key: string) => void
  readonly onApplyToChecked: () => void
  // Spawn another ad slot from a creative, or remove a duplicate slot.
  readonly onDuplicate: (sourceKey: string) => void
  readonly onRemoveDuplicate: (key: string) => void
  // 'rail' (default) is the fixed-width desktop column; 'sheet' spans full width
  // for use inside the mobile bottom-sheet drawer.
  readonly variant?: 'rail' | 'sheet'
}

export default memo(function CreativeRail({
  items,
  baseFilled,
  overrides,
  activeKey,
  checkedKeys,
  onSelect,
  onToggleCheck,
  onApplyToChecked,
  onDuplicate,
  onRemoveDuplicate,
  variant = 'rail',
}: Props): JSX.Element {
  // The active creative is the source of a bulk apply, so it reads as a locked
  // checked row; "selected" then means the *other* creatives to copy onto.
  const othersChecked = [...checkedKeys].filter((key) => key !== activeKey).length

  return (
    <Box className={`${styles.root} ${variant === 'sheet' ? styles.sheet : ''}`}>
      <Typography component="h3" variant="inherit" className={styles.heading}>
        {`Creatives (${items.length})`}
      </Typography>

      <Box component="ul" className={styles.list}>
        {items.map((item) => {
          const isActive = item.key === activeKey
          const override = overrides.get(item.key)
          const missing = REQUIRED_FIELDS.some((f) => fieldStatus(baseFilled, override, f) === 'missing')
          return (
            <Box component="li" key={item.key} className={styles.row}>
              <Tooltip title={isActive ? 'Editing now' : ''} placement="top" disableInteractive>
                <Box component="span" className={styles.checkWrap}>
                  <Checkbox
                    size="small"
                    className={styles.check}
                    checked={isActive || checkedKeys.has(item.key)}
                    disabled={isActive}
                    onChange={() => onToggleCheck(item.key)}
                    inputProps={{
                      'aria-label': isActive
                        ? `${item.name} — editing now`
                        : `Select ${item.name} for bulk apply`,
                    }}
                  />
                </Box>
              </Tooltip>
              <Box
                component="button"
                type="button"
                className={`${styles.selectButton} ${isActive ? styles.selectButtonActive : ''} ${missing ? styles.selectButtonMissing : ''}`}
                aria-pressed={isActive}
                onClick={() => onSelect(item.key)}
              >
                <Box className={styles.thumbWrap}>
                  {item.thumbUrl ? (
                    <Box component="img" src={item.thumbUrl} alt={item.name} className={styles.thumb} loading="lazy" />
                  ) : (
                    <Box component="span" className={styles.placeholder} aria-hidden>
                      <PlayArrowRoundedIcon fontSize="inherit" />
                    </Box>
                  )}
                </Box>
                <Box className={styles.info}>
                  <Tooltip title={item.name} placement="top" disableInteractive>
                    <Typography component="span" variant="inherit" className={styles.name}>
                      {item.name}
                    </Typography>
                  </Tooltip>
                  <CreativeStatusBadges baseFilled={baseFilled} override={override} />
                </Box>
              </Box>
              <Box className={styles.rowActions}>
                <Tooltip title="Duplicate the creative as separate ad" placement="top" disableInteractive>
                  <IconButton
                    size="small"
                    className={styles.actionBtn}
                    onClick={() => onDuplicate(item.sourceKey)}
                    aria-label={`Duplicate ${item.name}`}
                  >
                    <ContentCopyRoundedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                {item.isDuplicate && (
                  <Tooltip title="Remove this duplicate" placement="top" disableInteractive>
                    <IconButton
                      size="small"
                      className={styles.actionBtn}
                      onClick={() => onRemoveDuplicate(item.key)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <CloseRoundedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          )
        })}
      </Box>

      <Box className={styles.footer}>
        <Button
          type="button"
          size="small"
          variant="outlined"
          color="inherit"
          disabled={othersChecked === 0}
          onClick={onApplyToChecked}
          className={styles.footerButton}
        >
          {`Apply to selected (${othersChecked})`}
        </Button>
      </Box>
    </Box>
  )
})
