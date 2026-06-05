'use client'

import { memo, useCallback, useRef, type ChangeEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined'
import type { CtaType } from '@/lib/gateways/MetaAdsGateway'
import { CTA_OPTIONS, type CtaOption } from '../ctaOptions'
import { MAX_COPY_VARIATIONS } from '../copyFeatureFlags'
import { overrideCount, type CopyOverride } from '../perCreativeCopy'
import FormField from '../FormField/FormField'
import FormTextField from '../FormTextField/FormTextField'
import SearchSelect from '../SearchSelect/SearchSelect'
import StatusToggle from '../StatusToggle/StatusToggle'
import VariationList from './VariationList/VariationList'
import SharedFieldNote from './SharedFieldNote/SharedFieldNote'
import { isValidDestinationUrl } from './helpers'
import styles from './CopyForm.module.css'

const PRIMARY_TEXT_ROWS = 4

export interface CopyValue {
  readonly name: string
  readonly primaryTexts: readonly string[]
  readonly headlines: readonly string[]
  readonly description: string
  readonly url: string
  readonly cta: CtaType
  readonly activate: boolean
}

export const EMPTY_COPY: CopyValue = {
  name: '',
  primaryTexts: [''],
  headlines: [''],
  description: '',
  url: '',
  cta: 'SHOP_NOW',
  activate: false,
}

interface Props {
  readonly value: CopyValue
  readonly onChange: (next: CopyValue) => void
  readonly adsCount: number
  readonly overrides: ReadonlyMap<string, CopyOverride>
  readonly onAutoName?: () => void
  readonly onNameEach?: () => void
  readonly onEditEach?: () => void
}

export default memo(function CopyForm({
  value,
  onChange,
  adsCount,
  overrides,
  onAutoName,
  onNameEach,
  onEditEach,
}: Props): JSX.Element {
  const urlInvalid = value.url.trim() !== '' && !isValidDestinationUrl(value.url)

  // Field updaters read the latest value through a ref so each handler keeps a
  // stable identity. Without this the inline `{ ...value, … }` closures change on
  // every keystroke, breaking the memo on every sibling field — so typing in one
  // field re-renders them all. With it, only the edited field re-renders.
  const valueRef = useRef(value)
  valueRef.current = value

  const handleActivateChange = useCallback((next: boolean) => {
    onChange({ ...valueRef.current, activate: next })
  }, [onChange])
  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ ...valueRef.current, name: e.target.value })
  }, [onChange])
  const handlePrimaryChange = useCallback((next: readonly string[]) => {
    onChange({ ...valueRef.current, primaryTexts: next })
  }, [onChange])
  const handleHeadlineChange = useCallback((next: readonly string[]) => {
    onChange({ ...valueRef.current, headlines: next })
  }, [onChange])
  const handleDescriptionChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ ...valueRef.current, description: e.target.value })
  }, [onChange])
  const handleUrlChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ ...valueRef.current, url: e.target.value })
  }, [onChange])
  const handleCtaChange = useCallback((next: CtaOption | null) => {
    if (next) onChange({ ...valueRef.current, cta: next.id })
  }, [onChange])

  // Per-field "customized" counts drive the inform-don't-lock chip. They only mean
  // something with the per-creative editor available, so they hide without onEditEach.
  const primaryCustomized = overrideCount(overrides, 'primaryTexts')
  const headlineCustomized = overrideCount(overrides, 'headlines')
  const descriptionCustomized = overrideCount(overrides, 'description')
  const urlCustomized = overrideCount(overrides, 'url')

  return (
    <Box className={styles.root}>
      <Box component="section" className={styles.section}>
        <Box className={styles.sectionHeader}>
          <Typography component="h3" variant="inherit" className={styles.sectionTitle}>
            Ad identity
          </Typography>
          <StatusToggle
            activate={value.activate}
            onActivateChange={handleActivateChange}
            disabled={false}
          />
        </Box>

        <Box className={styles.sectionBody}>
          <Box className={styles.nameBlock}>
            <Box className={styles.nameHeader}>
              <Typography component="span" variant="inherit" className={styles.nameLabel}>
                Ad name
              </Typography>
              {onAutoName && (
                <Button
                  type="button"
                  size="small"
                  variant="text"
                  startIcon={<AutoAwesomeIcon fontSize="inherit" />}
                  onClick={onAutoName}
                  className={styles.nameButton}
                >
                  Auto-name
                </Button>
              )}
              {onNameEach && (
                <Button
                  type="button"
                  size="small"
                  variant="text"
                  startIcon={<DriveFileRenameOutlineIcon fontSize="inherit" />}
                  onClick={onNameEach}
                  className={styles.nameButton}
                >
                  {`Name each ad (${adsCount})`}
                </Button>
              )}
            </Box>
            <FormTextField
              type="text"
              value={onNameEach ? '' : value.name}
              placeholder={onNameEach ? 'Edit each ad name through the “Name each ad” button' : undefined}
              disabled={Boolean(onNameEach)}
              onChange={handleNameChange}
            />
          </Box>
        </Box>
      </Box>

      <Box component="section" className={styles.section}>
        <Box className={styles.sectionHeader}>
          <Typography component="h3" variant="inherit" className={styles.sectionTitle}>
            Copy
          </Typography>
          {onEditEach && (
            <Button
              type="button"
              size="small"
              variant="text"
              startIcon={<EditNoteOutlinedIcon fontSize="inherit" />}
              onClick={onEditEach}
              className={styles.editEachButton}
            >
              Edit copy per creative
            </Button>
          )}
        </Box>

        <Box className={styles.sectionBody}>
          <Box className={styles.field}>
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
            {onEditEach && primaryCustomized > 0 && (
              <SharedFieldNote count={primaryCustomized} onManage={onEditEach} />
            )}
          </Box>

          <Box className={styles.field}>
            <VariationList
              label="Headline"
              values={value.headlines}
              onChange={handleHeadlineChange}
              placeholder="Enter your ad title here"
              addNoun="headline"
              max={MAX_COPY_VARIATIONS}
            />
            {onEditEach && headlineCustomized > 0 && (
              <SharedFieldNote count={headlineCustomized} onManage={onEditEach} />
            )}
          </Box>

          <Box className={styles.field}>
            <FormField label="Description">
              <FormTextField
                type="text"
                placeholder="Enter your ad description here"
                value={value.description}
                onChange={handleDescriptionChange}
              />
            </FormField>
            {onEditEach && descriptionCustomized > 0 && (
              <SharedFieldNote count={descriptionCustomized} onManage={onEditEach} />
            )}
          </Box>

          <Box className={styles.actionRow}>
            <Box className={styles.field}>
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
              {onEditEach && urlCustomized > 0 && (
                <SharedFieldNote count={urlCustomized} onManage={onEditEach} />
              )}
            </Box>

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
    </Box>
  )
})
