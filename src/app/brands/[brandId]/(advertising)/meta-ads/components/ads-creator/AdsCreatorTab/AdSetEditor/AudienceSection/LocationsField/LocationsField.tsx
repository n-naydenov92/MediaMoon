'use client'

import { createContext, memo, useCallback, useContext, useMemo, useState, type HTMLAttributes } from 'react'
import Autocomplete, { type AutocompleteRenderGetTagProps, type AutocompleteRenderGroupParams } from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Paper, { type PaperProps } from '@mui/material/Paper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  COUNTRIES_SORTED,
  COUNTRY_PRESETS,
  findCountry,
  type Continent,
  type Country,
  type CountryPreset,
} from './countries'
import styles from './LocationsField.module.css'

type ContinentFilter = 'All' | Continent

const CONTINENT_TABS: readonly ContinentFilter[] = [
  'All',
  'Europe',
  'North America',
  'South America',
  'Asia',
  'Middle East',
  'Africa',
  'Oceania',
]

interface Props {
  readonly countries: readonly string[]
  readonly onChange: (next: readonly string[]) => void
  readonly disabled: boolean
}

function mergeCodes(existing: readonly string[], add: readonly string[]): readonly string[] {
  const set = new Set(existing.map((c) => c.toUpperCase()))
  for (const code of add) {
    set.add(code.toUpperCase())
  }
  return Array.from(set)
}

function renderCountryOption(
  props: HTMLAttributes<HTMLLIElement>,
  option: Country,
): JSX.Element {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- React 19 requires extracting key before spread
  const { key: _ignored, ...rest } = props as HTMLAttributes<HTMLLIElement> & { key?: string }
  return (
    <Box component="li" key={option.code} {...rest} className={styles.option}>
      <Typography component="span" variant="inherit" className={styles.optionCode}>
        {option.code}
      </Typography>
      <Typography component="span" variant="inherit" className={styles.optionName}>
        {option.name}
      </Typography>
    </Box>
  )
}

interface ContinentContextValue {
  readonly value: ContinentFilter
  readonly onChange: (next: ContinentFilter) => void
}

const ContinentContext = createContext<ContinentContextValue | null>(null)

function ContinentTabsStrip(): JSX.Element | null {
  const ctx = useContext(ContinentContext)
  if (!ctx) return null
  return (
    <Box
      className={styles.tabsWrap}
      // Prevent input blur when clicking the tab strip — otherwise the
      // Autocomplete popper closes before setContinent fires.
      onMouseDown={(e) => e.preventDefault()}
    >
      <Tabs
        value={ctx.value}
        onChange={(_, next: ContinentFilter) => ctx.onChange(next)}
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        className={styles.tabs}
      >
        {CONTINENT_TABS.map((label) => (
          <Tab
            key={label}
            value={label}
            label={label}
            className={styles.tab}
            disableRipple
          />
        ))}
      </Tabs>
    </Box>
  )
}

function PaperWithTabs(paperProps: PaperProps): JSX.Element {
  return (
    <Paper {...paperProps} className={styles.paper}>
      <ContinentTabsStrip />
      {paperProps.children}
    </Paper>
  )
}

function renderCountryTags(
  value: readonly Country[],
  getTagProps: AutocompleteRenderGetTagProps,
): JSX.Element[] {
  return value.map((option, index) => {
    const { key, ...rest } = getTagProps({ index })
    return (
      <Chip
        key={key}
        label={`${option.code} · ${option.name}`}
        size="small"
        {...rest}
        className={styles.chip}
      />
    )
  })
}

export default memo(function LocationsField({
  countries,
  onChange,
  disabled,
}: Props): JSX.Element {
  const [continent, setContinent] = useState<ContinentFilter>('All')
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(() => new Set())
  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }, [])

  const selected = useMemo(() => countries.map((c) => findCountry(c)), [countries])

  const continentCtx = useMemo<ContinentContextValue>(
    () => ({ value: continent, onChange: setContinent }),
    [continent],
  )

  const renderGroup = useCallback((params: AutocompleteRenderGroupParams): JSX.Element => {
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

  const handlePreset = (preset: CountryPreset): void => {
    onChange(mergeCodes(countries, preset.codes))
  }

  return (
    <ContinentContext.Provider value={continentCtx}>
    <Box className={styles.root}>
      <Box className={styles.presets}>
        <Typography component="span" variant="inherit" className={styles.presetsLabel}>
          Quick presets
        </Typography>
        {COUNTRY_PRESETS.map((preset) => (
          <Chip
            key={preset.id}
            label={preset.label}
            size="small"
            icon={<AddIcon fontSize="inherit" />}
            onClick={() => handlePreset(preset)}
            disabled={disabled}
            variant="outlined"
            className={styles.presetChip}
            clickable
          />
        ))}
      </Box>

      <Autocomplete<Country, true>
        multiple
        options={COUNTRIES_SORTED}
        value={selected}
        disabled={disabled}
        onChange={(_, next) => onChange(next.map((c) => c.code))}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.code === value.code}
        groupBy={continent === 'All' ? (option) => option.continent : undefined}
        filterSelectedOptions
        size="small"
        PaperComponent={PaperWithTabs}
        classes={{ listbox: styles.listbox, option: styles.option }}
        filterOptions={(options, state) => {
          let filtered = options
          if (continent !== 'All') {
            filtered = filtered.filter((o) => o.continent === continent)
          }
          const q = state.inputValue.toLowerCase().trim()
          if (q) {
            filtered = filtered.filter((o) => (
              o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q)
            ))
          }
          return filtered
        }}
        renderOption={renderCountryOption}
        renderGroup={renderGroup}
        renderTags={renderCountryTags}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={selected.length === 0 ? 'Add country…' : ''}
            size="small"
          />
        )}
      />
    </Box>
    </ContinentContext.Provider>
  )
})
