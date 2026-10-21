'use client'

import { memo, useCallback, type ChangeEvent, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import FormField from '../../../FormField/FormField'
import FormTextField from '../../../FormTextField/FormTextField'
import SearchSelect from '../../../SearchSelect/SearchSelect'
import VariationList from '../../../CopyForm/VariationList/VariationList'
import { type CopyValue } from '../../../CopyForm/CopyForm'
import { CTA_OPTIONS, type CtaOption } from '../../../ctaOptions'
import { MAX_COPY_VARIATIONS } from '../../../copyFeatureFlags'
import { destinationUrlValidity } from '../../../CopyForm/helpers'
import { firstFilled, type OverridableField } from '../../../perCreativeCopy'
import HeaderAction from './HeaderAction/HeaderAction'
import styles from './CopyDetail.module.css'

const PRIMARY_TEXT_ROWS = 4

interface Props {
  readonly value: CopyValue | null
  readonly onFieldChange: <F extends OverridableField>(field: F, next: CopyValue[F]) => void
  readonly onReset: () => void
  readonly canReset: boolean
  // Act on the creative being edited, so it's always the one in the preview.
  readonly onDuplicate: () => void
  readonly onRemove: () => void
  readonly canRemove: boolean
  readonly iconOnlyActions: boolean
  // Ad names are per ad, not copy — the caller owns them and slots the field in here.
  // Reset leaves it alone; each name has its own reset.
  readonly nameField: ReactNode
}

export default memo(function CopyDetail({
  value,
  onFieldChange,
  onReset,
  canReset,
  onDuplicate,
  onRemove,
  canRemove,
  iconOnlyActions,
  nameField,
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

  const primaryInvalid = !firstFilled(value.primaryTexts)
  const headlineInvalid = !firstFilled(value.headlines)
  const urlState = destinationUrlValidity(value.url, true, 'Destination URL is required')

  return (
    <Box className={styles.root}>
      <Box className={styles.header}>
        <Typography component="h4" variant="h4" className={styles.sectionTitle}>
          Creative Setup
        </Typography>
        <Box className={styles.headerActions}>
          <HeaderAction
            label="Duplicate"
            hint="Duplicate the creative as separate ad"
            icon={<ContentCopyRoundedIcon fontSize="inherit" />}
            onClick={onDuplicate}
            iconOnly={iconOnlyActions}
          />
          <HeaderAction
            label="Remove"
            hint={canRemove ? 'Remove the creative from this batch' : 'The last creative can’t be removed'}
            icon={<CloseRoundedIcon fontSize="inherit" />}
            onClick={onRemove}
            disabled={!canRemove}
            iconOnly={iconOnlyActions}
          />
          <HeaderAction
            label="Reset"
            hint="Go back to the shared copy"
            icon={<RestartAltOutlinedIcon fontSize="inherit" />}
            onClick={onReset}
            disabled={!canReset}
          />
        </Box>
      </Box>

      <Box className={styles.fields}>
        {nameField}

        <VariationList
          label="Primary Text"
          values={value.primaryTexts}
          onChange={handlePrimaryChange}
          placeholder="Enter your ad primary text here"
          addNoun="primary text"
          multiline
          firstRows={PRIMARY_TEXT_ROWS}
          max={MAX_COPY_VARIATIONS}
          invalid={primaryInvalid}
          errorText="Primary text is required"
        />

        <VariationList
          label="Headline"
          values={value.headlines}
          onChange={handleHeadlineChange}
          placeholder="Enter your ad title here"
          addNoun="headline"
          max={MAX_COPY_VARIATIONS}
          invalid={headlineInvalid}
          errorText="Headline is required"
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
              error={urlState.error}
              helperText={urlState.helper}
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
    </Box>
  )
})
