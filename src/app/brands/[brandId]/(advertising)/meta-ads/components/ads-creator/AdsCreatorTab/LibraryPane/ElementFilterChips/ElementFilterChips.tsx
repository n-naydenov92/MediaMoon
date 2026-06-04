'use client'

import { memo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import ListItemIcon from '@mui/material/ListItemIcon'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import ImageRoundedIcon from '@mui/icons-material/ImageRounded'
import type { FilterRule } from '@/lib/meta/filterRules'
import RuleChip from '../../../../shared/filters/RuleChip/RuleChip'
import type { PresetDef, PresetKey } from '../config'
import styles from './ElementFilterChips.module.css'

const ICON_BY_KEY: Record<PresetKey, JSX.Element> = {
  all: <AutoAwesomeIcon fontSize="inherit" />,
  winners: <EmojiEventsRoundedIcon fontSize="inherit" />,
  underperformers: <TrendingDownRoundedIcon fontSize="inherit" />,
  video: <PlayArrowRoundedIcon fontSize="inherit" />,
  image: <ImageRoundedIcon fontSize="inherit" />,
}

interface Props {
  readonly presets: readonly PresetDef[]
  readonly activePreset: PresetKey | null
  readonly rules: readonly FilterRule[]
  readonly onSelectPreset: (key: PresetKey) => void
  readonly onOpenAddFilter: () => void
  readonly onUpdateRule: (index: number, rule: FilterRule) => void
  readonly onRemoveRule: (index: number) => void
}

export default memo(function ElementFilterChips({
  presets,
  activePreset,
  rules,
  onSelectPreset,
  onOpenAddFilter,
  onUpdateRule,
  onRemoveRule,
}: Props): JSX.Element {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const mobileTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const activeDef = presets.find((p) => p.key === activePreset)
  const mobileLabel = activeDef?.label ?? 'Custom'

  function handleMobilePick(key: PresetKey): void {
    onSelectPreset(key)
    setMobileMenuOpen(false)
  }

  return (
    <Stack className={styles.root} spacing={1.25}>
      <Stack direction="row" alignItems="center" className={styles.chipRow}>
        {presets.map((preset) => {
          const active = activePreset === preset.key
          return (
            <Chip
              key={preset.key}
              icon={<Box className={styles.chipIcon} data-key={preset.key}>{ICON_BY_KEY[preset.key]}</Box>}
              label={preset.label}
              clickable
              onClick={() => onSelectPreset(preset.key)}
              variant={active ? 'filled' : 'outlined'}
              color={active ? 'primary' : 'default'}
              size="small"
              className={styles.presetChip}
              data-active={active ? 'true' : 'false'}
              data-key={preset.key}
            />
          )
        })}
        <Chip
          label="+ Add filter"
          clickable
          onClick={onOpenAddFilter}
          variant="outlined"
          size="small"
          className={styles.addFilter}
        />
      </Stack>

      <Box className={styles.mobileBar}>
        <Button
          ref={mobileTriggerRef}
          size="small"
          variant="outlined"
          color="inherit"
          endIcon={<KeyboardArrowDownIcon />}
          onClick={() => setMobileMenuOpen(true)}
          className={styles.mobileTrigger}
        >
          <Box component="span" className={styles.mobileTriggerLabel}>
            {mobileLabel}
          </Box>
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<AddIcon fontSize="small" />}
          onClick={onOpenAddFilter}
          className={styles.mobileAddFilter}
        >
          Filter
        </Button>
        <Menu
          anchorEl={mobileTriggerRef.current}
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { className: styles.mobileMenuPaper } }}
        >
          {presets.map((preset) => (
            <MenuItem
              key={preset.key}
              dense
              selected={preset.key === activePreset}
              onClick={() => handleMobilePick(preset.key)}
            >
              <ListItemIcon className={styles.menuIcon} data-key={preset.key}>
                {ICON_BY_KEY[preset.key]}
              </ListItemIcon>
              <ListItemText primary={preset.label} />
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {rules.length > 0 && (
        <Stack direction="row" alignItems="center" className={styles.ruleRow}>
          <Typography component="span" className={styles.ruleLabel}>
            Filtered by:
          </Typography>
          {rules.map((rule, index) => (
            <RuleChip
              key={`${rule.field}-${rule.operator}-${index}`}
              rule={rule}
              isEditing={editingIndex === index}
              onStartEdit={() => setEditingIndex(index)}
              onCancelEdit={() => setEditingIndex(null)}
              onSave={(next) => {
                setEditingIndex(null)
                onUpdateRule(index, next)
              }}
              onRemove={() => {
                setEditingIndex(null)
                onRemoveRule(index)
              }}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
})
