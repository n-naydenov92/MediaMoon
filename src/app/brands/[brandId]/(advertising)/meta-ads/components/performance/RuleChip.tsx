'use client'

import { memo, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import InputBase from '@mui/material/InputBase'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import {
  CREATIVE_TYPE_VALUES,
  STATUS_VALUES,
  getFieldKind,
  parseFilterValue,
  type FilterRule,
} from './filterRules'
import { fieldLabel, formatRuleValue, operatorLabel } from './ruleLabels'
import styles from './RuleChip.module.css'

interface Props {
  readonly rule: FilterRule
  readonly isEditing: boolean
  readonly onStartEdit: () => void
  readonly onCancelEdit: () => void
  readonly onSave: (rule: FilterRule) => void
  readonly onRemove: () => void
}

export default memo(function RuleChip({
  rule,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  onRemove,
}: Props): JSX.Element {
  const kind = getFieldKind(rule.field)
  const [valueAnchor, setValueAnchor] = useState<HTMLElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [draft, setDraft] = useState(String(rule.value))

  useEffect(() => {
    if (!isEditing) {
      return
    }

    setDraft(String(rule.value))
    if (kind === 'number') {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [isEditing, rule.value, kind])

  function commit(rawValue: string): void {
    const parsed = parseFilterValue(rule.field, rawValue)
    if (parsed === null || String(parsed) === String(rule.value)) {
      onCancelEdit()
      return
    }
    onSave({ ...rule, value: parsed })
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit(draft)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onCancelEdit()
    }
  }

  const enumOptions =
    // eslint-disable-next-line no-nested-ternary -- nested ternary clearer than refactor here
    kind === 'status' ? STATUS_VALUES : kind === 'creativeType' ? CREATIVE_TYPE_VALUES : null

  const showInput = isEditing && kind === 'number'

  const labelNode = (
    <Stack direction="row" alignItems="center" spacing={0.75} className={styles.ruleLabelInner}>
      <Box component="span" className={styles.ruleFieldOp}>
        {fieldLabel(rule.field)} {operatorLabel(rule.operator)}
      </Box>
      {showInput ? (
        <InputBase
          inputRef={inputRef}
          type="text"
          inputProps={{ inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' }}
          className={styles.ruleInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={() => commit(draft)}
        />
      ) : (
        <Box component="span" ref={setValueAnchor} className={styles.ruleValue}>
          {isEditing && enumOptions ? String(rule.value) : formatRuleValue(rule)}
        </Box>
      )}
    </Stack>
  )

  return (
    <Box component="span" className={styles.ruleChipWrap}>
      <Chip
        size="small"
        variant="outlined"
        label={labelNode}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest(`.${styles.ruleInput}`)) {
            return
          }
          if (!isEditing) {
            onStartEdit()
          }
        }}
        onDelete={onRemove}
        className={styles.ruleChip}
        data-editing={isEditing ? 'true' : 'false'}
      />
      {enumOptions && (
        <Menu
          anchorEl={valueAnchor}
          open={isEditing && Boolean(enumOptions) && Boolean(valueAnchor)}
          onClose={onCancelEdit}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { className: styles.menuPaper } }}
        >
          {enumOptions.map((option) => (
            <MenuItem
              key={option}
              dense
              selected={option === rule.value}
              onClick={() => {
                if (option === rule.value) {
                  onCancelEdit()
                  return
                }
                onSave({ ...rule, value: option })
              }}
            >
              {option}
            </MenuItem>
          ))}
        </Menu>
      )}
    </Box>
  )
})
