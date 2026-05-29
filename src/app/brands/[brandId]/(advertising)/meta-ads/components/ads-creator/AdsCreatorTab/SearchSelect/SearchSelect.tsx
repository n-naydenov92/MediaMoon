'use client'

import { memo, type ReactNode } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CheckIcon from '@mui/icons-material/Check'
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
  renderRowAction,
  noOptionsText = 'No matches.',
}: Props<T>): JSX.Element {
  const triggerIcon: ReactNode = value && getOptionIcon ? getOptionIcon(value) : leadingIcon
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
      autoHighlight
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
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
