'use client'

import {
  createContext,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import Autocomplete, { type AutocompleteRenderGroupParams } from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CheckIcon from '@mui/icons-material/Check'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import styles from './SearchSelect.module.css'

export type OptionStatus = 'active' | 'paused' | 'warn' | 'inactive'

export interface SearchSelectCreateAction {
  readonly label: string
  readonly onClick: () => void
}

const CreateActionContext = createContext<SearchSelectCreateAction | null>(null)

const ListboxWithCreate = forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  function ListboxWithCreate({ children, ...rest }, ref) {
    const action = useContext(CreateActionContext)
    if (!action) {
      return <Box component="ul" {...rest} ref={ref}>{children}</Box>
    }
    return (
      <Box component="ul" {...rest} ref={ref}>
        <Box
          component="li"
          className={`${styles.option} ${styles.createOption}`}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            action.onClick()
          }}
        >
          <Box component="span" className={styles.optionIcon} aria-hidden>
            <AddCircleOutlineIcon fontSize="small" />
          </Box>
          <Typography component="span" variant="inherit" className={styles.createOptionLabel}>
            {action.label}
          </Typography>
        </Box>
        {children}
      </Box>
    )
  },
)

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
  // When set, the status dot is wrapped in a tooltip with this label (e.g. the human
  // account/campaign status) so hovering a dot explains what its colour means.
  readonly getOptionStatusLabel?: (option: T) => string
  readonly getOptionIcon?: (option: T) => ReactNode
  readonly getOptionGroup?: (option: T) => string
  readonly collapsibleGroups?: boolean
  readonly renderRowAction?: (option: T) => ReactNode
  readonly noOptionsText?: string
  readonly createAction?: SearchSelectCreateAction
  readonly error?: boolean
  readonly errorText?: string
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
  getOptionStatusLabel,
  getOptionIcon,
  getOptionGroup,
  collapsibleGroups = false,
  renderRowAction,
  noOptionsText = 'No matches.',
  createAction,
  error = false,
  errorText,
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
    <CreateActionContext.Provider value={createAction ?? null}>
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
          listbox: collapsibleGroups
            ? `${styles.menuList} ${styles.menuListFixed}`
            : styles.menuList,
          option: styles.option,
        }}
        ListboxComponent={createAction ? ListboxWithCreate : undefined}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            error={error}
            helperText={error ? errorText : undefined}
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
          const { key: keyToOmit, ...rest } = optionProps as React.HTMLAttributes<HTMLLIElement> & { key?: string }
          void keyToOmit
          const label = getOptionLabel(option)
          const secondary = getOptionSecondary ? getOptionSecondary(option) : null
          const tooltipText = secondary ? `${label} ${secondary}` : label
          const icon: ReactNode = getOptionIcon ? getOptionIcon(option) : leadingIcon
          const statusLabel = getOptionStatusLabel ? getOptionStatusLabel(option) : ''
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
                <Tooltip title={statusLabel} placement="top" disableInteractive>
                  <Box
                    component="span"
                    className={styles.statusDot}
                    data-status={getOptionStatus(option)}
                    aria-hidden
                  />
                </Tooltip>
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
    </CreateActionContext.Provider>
  )
}

const SearchSelect = memo(SearchSelectInner) as typeof SearchSelectInner
export default SearchSelect
