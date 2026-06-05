'use client'

import { memo, useCallback, type ChangeEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import FormField from '../../../FormField/FormField'
import FormTextField from '../../../FormTextField/FormTextField'
import SearchSelect from '../../../SearchSelect/SearchSelect'
import VariationList from '../../../CopyForm/VariationList/VariationList'
import { type CopyValue } from '../../../CopyForm/CopyForm'
import { CTA_OPTIONS, type CtaOption } from '../../../ctaOptions'
import { MAX_COPY_VARIATIONS } from '../../../copyFeatureFlags'
import { isValidDestinationUrl } from '../../../CopyForm/helpers'
import type { OverridableField } from '../../../perCreativeCopy'
import styles from './CopyDetail.module.css'

const PRIMARY_TEXT_ROWS = 4

interface Props {
  readonly value: CopyValue | null
  readonly creativeName: string | null
  readonly onFieldChange: <F extends OverridableField>(field: F, next: CopyValue[F]) => void
  readonly onReset: () => void
  readonly canReset: boolean
}

export default memo(function CopyDetail({
  value,
  creativeName,
  onFieldChange,
  onReset,
  canReset,
}: Props): JSX.Element {
  // onFieldChange is already stable; wrapping each field keeps the per-field
  // callbacks stable too, so the untouched fields skip re-render while typing.
  const handlePrimaryChange = useCallback((next: readonly string[]) => {
    onFieldChange('primaryTexts', next)
  }, [onFieldChange])
  const handleHeadlineChange = useCallback((next: readonly string[]) => {
    onFieldChange('headlines', next)
  }, [onFieldChange])
  const handleDescriptionChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onFieldChange('description', e.target.value)
  }, [onFieldChange])
  const handleUrlChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onFieldChange('url', e.target.value)
  }, [onFieldChange])
  const handleCtaChange = useCallback((next: CtaOption | null) => {
    if (next) onFieldChange('cta', next.id)
  }, [onFieldChange])

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
      <Box className={styles.header}>
        <Typography component="span" variant="inherit" className={styles.editing}>
          {creativeName ? `Editing: ${creativeName}` : 'Editing copy'}
        </Typography>
        <Button
          type="button"
          size="small"
          variant="text"
          color="inherit"
          startIcon={<RestartAltOutlinedIcon fontSize="inherit" />}
          disabled={!canReset}
          onClick={onReset}
          className={styles.resetButton}
        >
          Reset to shared
        </Button>
      </Box>

      <VariationList
        label="Primary Text"
        values={value.primaryTexts}
        onChange={handlePrimaryChange}
        placeholder="Enter your ad primary text here"
        addNoun="primary text"
        multiline
        firstRows={PRIMARY_TEXT_ROWS}
        max={MAX_COPY_VARIATIONS}
      />

      <VariationList
        label="Headline"
        values={value.headlines}
        onChange={handleHeadlineChange}
        placeholder="Enter your ad title here"
        addNoun="headline"
        max={MAX_COPY_VARIATIONS}
      />

      <FormField label="Description">
        <FormTextField
          type="text"
          placeholder="Enter your ad description here"
          value={value.description}
          onChange={handleDescriptionChange}
        />
      </FormField>

      <Box className={styles.actionRow}>
        <FormField label="Destination URL">
          <FormTextField
            type="url"
            placeholder="https://example.com"
            value={value.url}
            onChange={handleUrlChange}
            error={urlInvalid}
            helperText={urlInvalid ? 'Enter a full URL, e.g. https://example.com' : undefined}
          />
        </FormField>

        <FormField label="Call to action">
          <SearchSelect<CtaOption>
            value={CTA_OPTIONS.find((o) => o.id === value.cta) ?? null}
            options={CTA_OPTIONS}
            onChange={handleCtaChange}
            placeholder="Select call to action…"
            getOptionId={(o) => o.id}
            getOptionLabel={(o) => o.label}
          />
        </FormField>
      </Box>
    </Box>
  )
})
