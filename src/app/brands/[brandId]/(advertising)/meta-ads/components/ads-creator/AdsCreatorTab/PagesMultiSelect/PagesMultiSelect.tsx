'use client'

import { memo, type HTMLAttributes } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined'
import type { Page } from '@/lib/gateways/MetaAdsGateway'
import styles from './PagesMultiSelect.module.css'

interface Props {
  readonly options: readonly Page[]
  readonly value: readonly string[]
  readonly onChange: (next: readonly string[]) => void
  readonly disabled?: boolean
}

function triggerPlaceholder(selectedCount: number, singleName: string | null): string {
  if (selectedCount === 0) return 'Select pages…'
  if (selectedCount === 1 && singleName) return singleName
  return `${selectedCount} selected pages`
}

export default memo(function PagesMultiSelect({
  options,
  value,
  onChange,
  disabled = false,
}: Props): JSX.Element {
  const selected = options.filter((p) => value.includes(p.id))
  const placeholder = triggerPlaceholder(selected.length, selected[0]?.name ?? null)

  return (
    <Autocomplete<Page, true>
      multiple
      disableCloseOnSelect
      size="small"
      options={[...options]}
      value={selected}
      onChange={(_, next) => onChange(next.map((p) => p.id))}
      disabled={disabled || options.length === 0}
      getOptionLabel={(o) => o.name}
      getOptionKey={(o) => o.id}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(opts, state) => {
        const q = state.inputValue.toLowerCase().trim()
        if (!q) return opts
        return opts.filter((o) => o.name.toLowerCase().includes(q) || o.id.includes(q))
      }}
      openOnFocus
      handleHomeEndKeys
      classes={{
        paper: styles.menuPaper,
        listbox: styles.menuList,
        option: styles.option,
      }}
      renderTags={() => null}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <Box component="span" className={styles.triggerIconWrap} aria-hidden>
                <FacebookOutlinedIcon fontSize="small" />
              </Box>
            ),
          }}
        />
      )}
      renderOption={(optionProps, option, { selected: isSelected }) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- React 19 requires extracting key before spread
        const { key: _ignored, ...rest } = optionProps as HTMLAttributes<HTMLLIElement> & { key?: string }
        return (
          <Tooltip
            key={option.id}
            title={`${option.name} (${option.id})`}
            placement="top"
            disableInteractive
            enterDelay={400}
          >
            <Box
              component="li"
              {...rest}
              className={styles.option}
              data-selected={isSelected ? 'true' : 'false'}
            >
              <Checkbox
                checked={isSelected}
                className={styles.optionCheckbox}
                disableRipple
                tabIndex={-1}
                size="small"
              />
              {option.pictureUrl ? (
                <Box
                  component="img"
                  src={option.pictureUrl}
                  alt={option.name}
                  referrerPolicy="no-referrer"
                  className={styles.optionAvatar}
                />
              ) : (
                <Box component="span" className={styles.optionIcon} aria-hidden>
                  <FacebookOutlinedIcon fontSize="small" />
                </Box>
              )}
              <Typography component="span" variant="inherit" className={styles.optionName}>
                {option.name}
              </Typography>
            </Box>
          </Tooltip>
        )
      }}
      noOptionsText={(
        <Typography component="span" variant="inherit" className={styles.empty}>
          No pages match this search.
        </Typography>
      )}
    />
  )
})
