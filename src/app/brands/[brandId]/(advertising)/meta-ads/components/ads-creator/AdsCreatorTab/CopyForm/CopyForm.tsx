'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined'
import type { CtaType } from '@/lib/gateways/MetaAdsGateway'
import { CTA_OPTIONS, type CtaOption } from '../ctaOptions'
import FormField from '../FormField/FormField'
import FormTextField from '../FormTextField/FormTextField'
import SearchSelect from '../SearchSelect/SearchSelect'
import StatusToggle from '../StatusToggle/StatusToggle'
import VariationList from './VariationList/VariationList'
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
  readonly onAutoName?: () => void
  readonly onNameEach?: () => void
  readonly onEditEach?: () => void
}

export default memo(function CopyForm({
  value,
  onChange,
  adsCount,
  onAutoName,
  onNameEach,
  onEditEach,
}: Props): JSX.Element {
  const urlInvalid = value.url.trim() !== '' && !isValidDestinationUrl(value.url)

  return (
    <Box className={styles.root}>
      <Box className={styles.statusRow}>
        <StatusToggle
          activate={value.activate}
          onActivateChange={(next) => onChange({ ...value, activate: next })}
          disabled={false}
        />
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
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </Box>

      <VariationList
        label="Primary Text"
        values={value.primaryTexts}
        onChange={(next) => onChange({ ...value, primaryTexts: next })}
        placeholder="Enter your ad primary text here"
        addNoun="primary text"
        multiline
        firstRows={PRIMARY_TEXT_ROWS}
      />

      <VariationList
        label="Headline"
        values={value.headlines}
        onChange={(next) => onChange({ ...value, headlines: next })}
        placeholder="Enter your ad title here"
        addNoun="headline"
      />

      <FormField label="Description">
        <FormTextField
          type="text"
          placeholder="Enter your ad description here"
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
      </FormField>

      <Box className={styles.actionRow}>
        <FormField label="Destination URL">
          <FormTextField
            type="url"
            placeholder="https://example.com"
            value={value.url}
            onChange={(e) => onChange({ ...value, url: e.target.value })}
            error={urlInvalid}
            helperText={urlInvalid ? 'Enter a full URL, e.g. https://example.com' : undefined}
          />
        </FormField>

        <FormField label="Call to action">
          <SearchSelect<CtaOption>
            value={CTA_OPTIONS.find((o) => o.id === value.cta) ?? null}
            options={CTA_OPTIONS}
            onChange={(next) => {
              if (next) onChange({ ...value, cta: next.id })
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
