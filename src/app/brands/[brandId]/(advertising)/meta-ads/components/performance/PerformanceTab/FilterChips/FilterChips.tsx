'use client'

import { memo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import AddIcon from '@mui/icons-material/Add'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import ImageRoundedIcon from '@mui/icons-material/ImageRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import RuleChip from '../../../shared/filters/RuleChip/RuleChip'
import type { FilterRule } from '@/lib/meta/filterRules'
import styles from './FilterChips.module.css'

export type ChipKey =
  | 'all'
  | 'top-all'
  | 'top-video'
  | 'top-image'
  | 'winners'
  | 'underperformers'

interface ChipOption {
  readonly key: ChipKey
  readonly label: string
  readonly icon: JSX.Element
}

const CHIPS: readonly ChipOption[] = [
  { key: 'all', label: 'All with spend', icon: <AutoAwesomeIcon fontSize="inherit" /> },
  { key: 'top-all', label: 'Top Creatives', icon: <TrendingUpRoundedIcon fontSize="inherit" /> },
  { key: 'top-video', label: 'Top Videos', icon: <PlayArrowRoundedIcon fontSize="inherit" /> },
  { key: 'top-image', label: 'Top Statics', icon: <ImageRoundedIcon fontSize="inherit" /> },
  { key: 'winners', label: 'Winners', icon: <EmojiEventsRoundedIcon fontSize="inherit" /> },
  { key: 'underperformers', label: 'Underperforms', icon: <TrendingDownRoundedIcon fontSize="inherit" /> },
]

interface Props {
  readonly activeChip: ChipKey | null
  readonly onChipSelect: (chip: ChipKey) => void
  readonly activeRules: readonly FilterRule[]
  readonly onUpdateRule: (index: number, rule: FilterRule) => void
  readonly onRemoveRule: (index: number) => void
  readonly onOpenAddFilter: () => void
}

export default memo(function FilterChips({
  activeChip,
  onChipSelect,
  activeRules,
  onUpdateRule,
  onRemoveRule,
  onOpenAddFilter,
}: Props): JSX.Element {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const mobileTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const activePreset = CHIPS.find((c) => c.key === activeChip)
  const mobileLabel = activePreset?.label ?? 'Choose preset'

  function handleMobilePick(key: ChipKey): void {
    onChipSelect(key)
    setMobileMenuOpen(false)
  }

  return (
    <Stack className={styles.root} spacing={1.25}>
      <Stack direction="row" alignItems="center" className={styles.chipRow}>
        {CHIPS.map((chip) => {
          const active = activeChip === chip.key
          return (
            <Chip
              key={chip.key}
              icon={<Box className={styles.chipIcon}>{chip.icon}</Box>}
              label={chip.label}
              clickable
              onClick={() => onChipSelect(chip.key)}
              variant={active ? 'filled' : 'outlined'}
              color={active ? 'primary' : 'default'}
              className={styles.presetChip}
              data-active={active ? 'true' : 'false'}
              data-key={chip.key}
              size="small"
            />
          )
        })}
        <Chip
          label="+ Add filter"
          clickable
          onClick={onOpenAddFilter}
          variant="outlined"
          className={styles.addFilter}
          size="small"
        />
      </Stack>
      <Box className={styles.mobileBar}>
        <Button
          ref={mobileTriggerRef}
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={
            activePreset ? (
              <Box className={styles.chipIcon} data-key={activePreset.key}>
                {activePreset.icon}
              </Box>
            ) : undefined
          }
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
          {CHIPS.map((chip) => (
            <MenuItem
              key={chip.key}
              dense
              selected={chip.key === activeChip}
              onClick={() => handleMobilePick(chip.key)}
            >
              <ListItemIcon className={styles.menuIcon} data-key={chip.key}>
                {chip.icon}
              </ListItemIcon>
              <ListItemText primary={chip.label} />
            </MenuItem>
          ))}
        </Menu>
      </Box>
      {activeRules.length > 0 && (
        <Stack direction="row" alignItems="center" className={styles.ruleRow}>
          <Typography component="span" className={styles.ruleLabel}>
            Filtered by:
          </Typography>
          {activeRules.map((rule, index) => {
            const isEditing = editingIndex === index
            return (
              <RuleChip
                key={`${rule.field}-${rule.operator}-${index}`}
                rule={rule}
                isEditing={isEditing}
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
            )
          })}
        </Stack>
      )}
    </Stack>
  )
})
