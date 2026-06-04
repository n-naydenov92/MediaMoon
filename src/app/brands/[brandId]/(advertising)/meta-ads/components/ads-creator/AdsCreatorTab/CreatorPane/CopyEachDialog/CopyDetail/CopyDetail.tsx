'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined'
import FormField from '../../../FormField/FormField'
import FormTextField from '../../../FormTextField/FormTextField'
import SearchSelect from '../../../SearchSelect/SearchSelect'
import VariationList from '../../../CopyForm/VariationList/VariationList'
import { type CopyValue } from '../../../CopyForm/CopyForm'
import { CTA_OPTIONS, type CtaOption } from '../../../ctaOptions'
import { isValidDestinationUrl } from '../../../CopyForm/helpers'
import type { OverridableField } from '../../../perCreativeCopy'
import styles from './CopyDetail.module.css'

const PRIMARY_TEXT_ROWS = 4

interface Props {
  readonly value: CopyValue | null
  readonly onFieldChange: <F extends OverridableField>(field: F, next: CopyValue[F]) => void
  readonly onImport: (anchor: HTMLElement) => void
}

export default memo(function CopyDetail({ value, onFieldChange, onImport }: Props): JSX.Element {
  if (!value) {
    return (
      <Box className={styles.empty}>
        <Typography component="span" variant="inherit">
          Select a creative on the left to edit its copy.
        </Typography>
      </Box>
    )
  }

  const urlInvalid = value.url.trim() !== '' && !isValidDestinationUrl(value.url)

  return (
    <Box className={styles.root}>
      <Box className={styles.actions}>
        <Button
          type="button"
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<DownloadOutlinedIcon fontSize="inherit" />}
          onClick={(e) => onImport(e.currentTarget)}
          className={styles.actionButton}
        >
          Import
        </Button>
        <Button
          type="button"
          size="small"
          variant="text"
          color="inherit"
          disabled
          startIcon={<AutoFixHighOutlinedIcon fontSize="inherit" />}
          className={styles.actionButton}
        >
          Generate
        </Button>
      </Box>

      <VariationList
        label="Primary Text"
        values={value.primaryTexts}
        onChange={(next) => onFieldChange('primaryTexts', next)}
        placeholder="Enter your ad primary text here"
        addNoun="primary text"
        multiline
        firstRows={PRIMARY_TEXT_ROWS}
      />

      <VariationList
        label="Headline"
        values={value.headlines}
        onChange={(next) => onFieldChange('headlines', next)}
        placeholder="Enter your ad title here"
        addNoun="headline"
      />

      <FormField label="Description">
        <FormTextField
          type="text"
          placeholder="Enter your ad description here"
          value={value.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
        />
      </FormField>

      <Box className={styles.actionRow}>
        <FormField label="Destination URL">
          <FormTextField
            type="url"
            placeholder="https://example.com"
            value={value.url}
            onChange={(e) => onFieldChange('url', e.target.value)}
            error={urlInvalid}
            helperText={urlInvalid ? 'Enter a full URL, e.g. https://example.com' : undefined}
          />
        </FormField>

        <FormField label="Call to action">
          <SearchSelect<CtaOption>
            value={CTA_OPTIONS.find((o) => o.id === value.cta) ?? null}
            options={CTA_OPTIONS}
            onChange={(next) => {
              if (next) onFieldChange('cta', next.id)
            }}
            placeholder="Select call to action…"
            getOptionId={(o) => o.id}
            getOptionLabel={(o) => o.label}
          />
        </FormField>
      </Box>
    </Box>
  )
})
