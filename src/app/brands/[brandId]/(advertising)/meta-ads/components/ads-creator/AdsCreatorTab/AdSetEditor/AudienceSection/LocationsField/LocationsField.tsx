'use client'

import { memo, useCallback, useMemo, useState, type HTMLAttributes } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper, { type PaperProps } from '@mui/material/Paper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
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

export default memo(function LocationsField({
  countries,
  onChange,
  disabled,
}: Props): JSX.Element {
  const [continent, setContinent] = useState<ContinentFilter>('All')

  const selected = useMemo(() => countries.map((c) => findCountry(c)), [countries])

  const handlePreset = (preset: CountryPreset): void => {
    onChange(mergeCodes(countries, preset.codes))
  }

  const PaperComponent = useCallback((paperProps: PaperProps) => (
    <Paper {...paperProps} className={styles.paper}>
      <Box
        className={styles.tabsWrap}
        onMouseDown={(e) => e.preventDefault()}
      >
        <Tabs
          value={continent}
          onChange={(_, next: ContinentFilter) => setContinent(next)}
          variant="scrollable"
          scrollButtons="auto"
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
      {paperProps.children}
    </Paper>
  ), [continent])

  return (
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
        PaperComponent={PaperComponent}
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
        renderOption={(props, option) => {
          const { key, ...rest } = props as HTMLAttributes<HTMLLIElement> & { key?: string }
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
        }}
        renderGroup={(params) => (
          <Box component="li" key={params.key} className={styles.group}>
            <Typography component="div" variant="inherit" className={styles.groupHeader}>
              {params.group}
            </Typography>
            <Box component="ul" className={styles.groupList}>
              {params.children}
            </Box>
          </Box>
        )}
        renderTags={(value, getTagProps) => value.map((option, index) => {
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
        })}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={selected.length === 0 ? 'Add country…' : ''}
            size="small"
          />
        )}
      />
    </Box>
  )
})
