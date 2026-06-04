'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import type { CopyValue } from '../../../CopyForm/CopyForm'
import type { CopyOverride } from '../../../perCreativeCopy'
import CreativeStatusBadges from '../../../CreativeStatusBadges/CreativeStatusBadges'
import type { CreativeItem } from '../helpers'
import styles from './CreativeRail.module.css'

interface Props {
  readonly items: readonly CreativeItem[]
  readonly base: CopyValue
  readonly overrides: ReadonlyMap<string, CopyOverride>
  readonly activeKey: string | null
  readonly checkedKeys: ReadonlySet<string>
  readonly onSelect: (key: string) => void
  readonly onToggleCheck: (key: string) => void
  readonly onApplyToChecked: () => void
  readonly onResetActive: () => void
}

export default memo(function CreativeRail({
  items,
  base,
  overrides,
  activeKey,
  checkedKeys,
  onSelect,
  onToggleCheck,
  onApplyToChecked,
  onResetActive,
}: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <Typography component="h3" variant="inherit" className={styles.heading}>
        {`Creatives (${items.length})`}
      </Typography>

      <Box component="ul" className={styles.list}>
        {items.map((item) => {
          const isActive = item.key === activeKey
          return (
            <Box component="li" key={item.key} className={styles.row}>
              <Checkbox
                size="small"
                className={styles.check}
                checked={checkedKeys.has(item.key)}
                onChange={() => onToggleCheck(item.key)}
                inputProps={{ 'aria-label': `Select ${item.name} for bulk apply` }}
              />
              <Box
                component="button"
                type="button"
                className={`${styles.selectButton} ${isActive ? styles.selectButtonActive : ''}`}
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
                  <Typography component="span" variant="inherit" className={styles.name}>
                    {item.name}
                  </Typography>
                  <CreativeStatusBadges base={base} override={overrides.get(item.key)} />
                </Box>
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
          disabled={!activeKey || checkedKeys.size === 0}
          onClick={onApplyToChecked}
          className={styles.footerButton}
        >
          {`Apply to selected (${checkedKeys.size})`}
        </Button>
        <Button
          type="button"
          size="small"
          variant="text"
          color="inherit"
          disabled={!activeKey || overrides.get(activeKey ?? '') === undefined}
          onClick={onResetActive}
          className={styles.footerButton}
        >
          Reset to shared
        </Button>
      </Box>
    </Box>
  )
})
