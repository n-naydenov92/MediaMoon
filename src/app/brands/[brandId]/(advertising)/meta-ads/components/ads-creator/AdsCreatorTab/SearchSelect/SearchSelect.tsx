'use client'

import { memo, useCallback, useState, type ReactNode } from 'react'
import Autocomplete, { type AutocompleteRenderGroupParams } from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CheckIcon from '@mui/icons-material/Check'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import styles from './SearchSelect.module.css'

export type OptionStatus = 'active' | 'paused'

interface Props<T> {
  readonly value: T | null
  readonly options: readonly T[]
  readonly onChange: (next: T | null) => void
  readonly placeholder: string
  readonly disabled?: boolean
  readonly leadingIcon?: ReactNode
  readonly getOptionId: (option: T) => string
  readonly getOptionLabel: (option: T) => string
  readonly getOptionSecondary?: (option: T) => string
  readonly getOptionStatus?: (option: T) => OptionStatus
  readonly getOptionIcon?: (option: T) => ReactNode
  readonly getOptionGroup?: (option: T) => string
  readonly collapsibleGroups?: boolean
  readonly renderRowAction?: (option: T) => ReactNode
  readonly noOptionsText?: string
}


function SearchSelectInner<T>({
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  leadingIcon,
  getOptionId,
  getOptionLabel,
  getOptionSecondary,
  getOptionStatus,
  getOptionIcon,
  getOptionGroup,
  collapsibleGroups = false,
  renderRowAction,
  noOptionsText = 'No matches.',
}: Props<T>): JSX.Element {
  // The trigger always prefers leadingIcon when provided so the picker shows
  // a stable brand/category mark; getOptionIcon stays for dropdown rows where
  // per-option visuals (avatars, status) help distinguish entries.
  const triggerIcon: ReactNode = leadingIcon ?? (value && getOptionIcon ? getOptionIcon(value) : null)

  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(() => new Set())
  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }, [])

  const renderGroupCollapsible = useCallback((params: AutocompleteRenderGroupParams): ReactNode => {
    const collapsed = collapsedGroups.has(params.group)
    return (
      <Box component="li" key={params.key} className={styles.group}>
        <Box
          component="button"
          type="button"
          className={styles.groupHeader}
          onClick={() => toggleGroup(params.group)}
          onMouseDown={(e) => e.preventDefault()}
          aria-expanded={!collapsed}
        >
          <Typography component="span" variant="inherit" className={styles.groupHeaderText}>
            {params.group}
          </Typography>
          <ExpandMoreIcon
            className={`${styles.groupChevron} ${!collapsed ? styles.groupChevronExpanded : ''}`}
            fontSize="inherit"
          />
        </Box>
        <Collapse in={!collapsed} timeout={180}>
          <Box component="ul" className={styles.groupList}>
            {params.children}
          </Box>
        </Collapse>
      </Box>
    )
  }, [collapsedGroups, toggleGroup])

  const renderGroupStatic = useCallback((params: AutocompleteRenderGroupParams): ReactNode => (
    <Box component="li" key={params.key} className={styles.group}>
      <Typography component="div" variant="inherit" className={styles.sectionLabel}>
        {params.group}
      </Typography>
      <Box component="ul" className={styles.sectionList}>
        {params.children}
      </Box>
    </Box>
  ), [])

  const renderGroup = collapsibleGroups ? renderGroupCollapsible : renderGroupStatic
  return (
    <Autocomplete<T>
      size="small"
      value={value}
      options={[...options]}
      disabled={disabled}
      getOptionLabel={(option) => getOptionLabel(option)}
      getOptionKey={(option) => getOptionId(option)}
      isOptionEqualToValue={(a, b) => getOptionId(a) === getOptionId(b)}
      filterOptions={(opts, state) => {
        const q = state.inputValue.toLowerCase().trim()
        if (q === '') return opts
        return opts.filter((o) => {
          const label = getOptionLabel(o).toLowerCase()
          const id = getOptionId(o).toLowerCase()
          const sec = getOptionSecondary ? getOptionSecondary(o).toLowerCase() : ''
          return label.includes(q) || id.includes(q) || sec.includes(q)
        })
      }}
      onChange={(_, next) => onChange(next)}
      openOnFocus
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      groupBy={getOptionGroup ? (option) => getOptionGroup(option) : undefined}
      renderGroup={getOptionGroup ? renderGroup : undefined}
      classes={{
        paper: styles.menuPaper,
        listbox: styles.menuList,
        option: styles.option,
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            startAdornment: triggerIcon ? (
              <Box component="span" className={styles.triggerIconWrap} aria-hidden>
                {triggerIcon}
              </Box>
            ) : undefined,
          }}
        />
      )}
      renderOption={(optionProps, option, { selected }) => {
        const { key: _ignored, ...rest } = optionProps as React.HTMLAttributes<HTMLLIElement> & { key?: string }
        const label = getOptionLabel(option)
        const secondary = getOptionSecondary ? getOptionSecondary(option) : null
        const tooltipText = secondary ? `${label} ${secondary}` : label
        const icon: ReactNode = getOptionIcon ? getOptionIcon(option) : leadingIcon
        return (
          <Box
            key={getOptionId(option)}
            component="li"
            {...rest}
            className={styles.option}
            data-selected={selected ? 'true' : 'false'}
          >
            {icon ? (
              <Box component="span" className={styles.optionIcon} aria-hidden>
                {icon}
              </Box>
            ) : null}
            {getOptionStatus && (
              <Box
                component="span"
                className={styles.statusDot}
                data-status={getOptionStatus(option)}
                aria-hidden
              />
            )}
            <Tooltip title={tooltipText} placement="top" disableInteractive enterDelay={400}>
              <Typography component="span" variant="inherit" className={styles.optionName}>
                {label}
              </Typography>
            </Tooltip>
            {secondary && (
              <Typography component="span" variant="inherit" className={styles.optionSecondary}>
                {secondary}
              </Typography>
            )}
            {renderRowAction && (
              <Box
                component="span"
                className={styles.optionAction}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {renderRowAction(option)}
              </Box>
            )}
            {selected && <CheckIcon className={styles.checkIconTrailing} fontSize="inherit" />}
          </Box>
        )
      }}
      noOptionsText={(
        <Typography component="span" variant="inherit" className={styles.empty}>
          {noOptionsText}
        </Typography>
      )}
    />
  )
}

const SearchSelect = memo(SearchSelectInner) as typeof SearchSelectInner
export default SearchSelect
