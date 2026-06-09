'use client'

import { memo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import SwipeableDrawer from '@mui/material/SwipeableDrawer'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import ImageRoundedIcon from '@mui/icons-material/ImageRounded'
import type { FilterRule } from '@/lib/meta/filterRules'
import RuleChip from '../../../../shared/filters/RuleChip/RuleChip'
import type { PresetDef, PresetKey, SortDirection, SortFieldDef, SortFieldId } from '../config'
import styles from './FilterSheet.module.css'

const ICON_BY_KEY: Record<PresetKey, JSX.Element> = {
  all: <AutoAwesomeIcon fontSize="inherit" />,
  winners: <EmojiEventsRoundedIcon fontSize="inherit" />,
  underperformers: <TrendingDownRoundedIcon fontSize="inherit" />,
  video: <PlayArrowRoundedIcon fontSize="inherit" />,
  image: <ImageRoundedIcon fontSize="inherit" />,
}

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly onOpen: () => void
  readonly presets: readonly PresetDef[]
  readonly activePreset: PresetKey | null
  readonly rules: readonly FilterRule[]
  readonly sortField: SortFieldId
  readonly sortDirection: SortDirection
  readonly sortFields: readonly SortFieldDef[]
  readonly onSortChange: (field: SortFieldId) => void
  readonly onSelectPreset: (key: PresetKey) => void
  readonly onUpdateRule: (index: number, rule: FilterRule) => void
  readonly onRemoveRule: (index: number) => void
  readonly onClearAll: () => void
  readonly onOpenAddFilter: () => void
}

export default memo(function FilterSheet({
  open,
  onClose,
  onOpen,
  presets,
  activePreset,
  rules,
  sortField,
  sortDirection,
  sortFields,
  onSortChange,
  onSelectPreset,
  onUpdateRule,
  onRemoveRule,
  onClearAll,
  onOpenAddFilter,
}: Props): JSX.Element {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const arrow = sortDirection === 'desc' ? '↓' : '↑'

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      disableSwipeToOpen
      className={styles.drawer}
      PaperProps={{ className: styles.paper }}
    >
      <Box className={styles.sheet}>
        <Box className={styles.handle} aria-hidden />
        <Box className={styles.header}>
          <Typography component="h2" variant="h3" className={styles.title}>
            Filters
          </Typography>
          {rules.length > 0 && (
            <Button
              type="button"
              size="small"
              variant="text"
              color="inherit"
              className={styles.clear}
              onClick={onClearAll}
            >
              Clear all
            </Button>
          )}
        </Box>

        <Box className={styles.section}>
          <Typography component="span" variant="caption" className={styles.sectionLabel}>
            Sort by
          </Typography>
          <Box className={styles.chips}>
            {sortFields.map((field) => {
              const active = field.id === sortField
              return (
                <Chip
                  key={field.id}
                  label={active ? `${field.label} ${arrow}` : field.label}
                  clickable
                  onClick={() => onSortChange(field.id)}
                  variant={active ? 'filled' : 'outlined'}
                  color={active ? 'primary' : 'default'}
                  size="small"
                  className={styles.chip}
                />
              )
            })}
          </Box>
        </Box>

        <Box className={styles.section}>
          <Typography component="span" variant="caption" className={styles.sectionLabel}>
            Quick filters
          </Typography>
          <Box className={styles.chips}>
            {presets.map((preset) => {
              const active = activePreset === preset.key
              return (
                <Chip
                  key={preset.key}
                  icon={(
                    <Box component="span" className={styles.chipIcon} data-key={preset.key}>
                      {ICON_BY_KEY[preset.key]}
                    </Box>
                  )}
                  label={preset.label}
                  clickable
                  onClick={() => onSelectPreset(preset.key)}
                  variant={active ? 'filled' : 'outlined'}
                  color={active ? 'primary' : 'default'}
                  size="small"
                  className={styles.chip}
                />
              )
            })}
          </Box>
        </Box>

        <Box className={styles.section}>
          <Box className={styles.sectionHead}>
            <Typography component="span" variant="caption" className={styles.sectionLabel}>
              Active filters
            </Typography>
            <Button
              type="button"
              size="small"
              variant="text"
              color="inherit"
              startIcon={<AddIcon fontSize="small" />}
              onClick={onOpenAddFilter}
              className={styles.addBtn}
            >
              Add filter
            </Button>
          </Box>
          {rules.length === 0 ? (
            <Typography component="span" variant="body2" className={styles.empty}>
              No filters applied
            </Typography>
          ) : (
            <Box className={styles.ruleList}>
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
            </Box>
          )}
        </Box>
      </Box>
    </SwipeableDrawer>
  )
})
