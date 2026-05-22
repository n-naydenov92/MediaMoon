'use client'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CloseIcon from '@mui/icons-material/Close'
import type { CtaType } from '@/lib/gateways/MetaAdsGateway'
import FormField from '../FormField/FormField'
import SearchSelect from '../SearchSelect/SearchSelect'
import styles from './CopyForm.module.css'

const MAX_TOTAL = 5

export interface CopyValue {
  readonly name: string
  readonly primaryTexts: readonly string[]
  readonly headlines: readonly string[]
  readonly description: string
  readonly url: string
  readonly cta: CtaType
}

export const EMPTY_COPY: CopyValue = {
  name: '',
  primaryTexts: [''],
  headlines: [''],
  description: '',
  url: '',
  cta: 'SHOP_NOW',
}

interface Props {
  readonly value: CopyValue
  readonly onChange: (next: CopyValue) => void
}

interface CtaOption {
  readonly id: CtaType
  readonly label: string
}

const CTA_OPTIONS: readonly CtaOption[] = [
  { id: 'LEARN_MORE', label: 'Learn more' },
  { id: 'SHOP_NOW', label: 'Shop now' },
  { id: 'SIGN_UP', label: 'Sign up' },
]

function setAt(arr: readonly string[], index: number, next: string): readonly string[] {
  const copy = [...arr]
  copy[index] = next
  return copy
}

function addAt(arr: readonly string[]): readonly string[] {
  if (arr.length >= MAX_TOTAL) return arr
  return [...arr, '']
}

function removeAt(arr: readonly string[], index: number): readonly string[] {
  return arr.filter((_, i) => i !== index)
}

export default function CopyForm({ value, onChange }: Props): JSX.Element {
  const primaryRemaining = MAX_TOTAL - value.primaryTexts.length
  const headlineRemaining = MAX_TOTAL - value.headlines.length

  return (
    <Box className={styles.root}>
      <Box className={styles.grid}>
        <Box className={styles.fullRow}>
          <FormField label="Ad name" hint="Internal — not shown in ads">
            <TextField
              type="text"
              size="small"
              variant="outlined"
              fullWidth
              className="density-form"
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
            />
          </FormField>
        </Box>

        <Box className={styles.fieldGroup}>
          <FormField label="Primary Text">
            <TextField
              multiline
              rows={4}
              size="small"
              variant="outlined"
              fullWidth
              className="density-form"
              placeholder="Enter your ad primary text here"
              value={value.primaryTexts[0]}
              onChange={(e) => onChange({
                ...value,
                primaryTexts: setAt(value.primaryTexts, 0, e.target.value),
              })}
            />
          </FormField>

          {value.primaryTexts.slice(1).map((text, idx) => {
            const index = idx + 1
            return (
              <Box key={`primary-var-${index}`} className={styles.variationRow}>
                <TextField
                  multiline
                  rows={2}
                  size="small"
                  variant="outlined"
                  fullWidth
                  className="density-form"
                  placeholder={`Variation ${index}`}
                  value={text}
                  onChange={(e) => onChange({
                    ...value,
                    primaryTexts: setAt(value.primaryTexts, index, e.target.value),
                  })}
                />
                <IconButton
                  size="small"
                  className={styles.removeVariation}
                  onClick={() => onChange({
                    ...value,
                    primaryTexts: removeAt(value.primaryTexts, index),
                  })}
                  aria-label={`Remove primary text variation ${index}`}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              </Box>
            )
          })}

          {primaryRemaining > 0 && (
            <Box
              component="button"
              type="button"
              className={styles.addVariation}
              onClick={() => onChange({
                ...value,
                primaryTexts: addAt(value.primaryTexts),
              })}
            >
              <AddCircleOutlineIcon fontSize="small" />
              {`Add primary text variation (${value.primaryTexts.length - 1}/${MAX_TOTAL - 1})`}
            </Box>
          )}
        </Box>

        <Box className={styles.fieldGroup}>
          <FormField label="Headline">
            <TextField
              type="text"
              size="small"
              variant="outlined"
              fullWidth
              className="density-form"
              placeholder="Enter your ad title here"
              value={value.headlines[0]}
              onChange={(e) => onChange({
                ...value,
                headlines: setAt(value.headlines, 0, e.target.value),
              })}
            />
          </FormField>

          {value.headlines.slice(1).map((text, idx) => {
            const index = idx + 1
            return (
              <Box key={`headline-var-${index}`} className={styles.variationRow}>
                <TextField
                  type="text"
                  size="small"
                  variant="outlined"
                  fullWidth
                  className="density-form"
                  placeholder={`Variation ${index}`}
                  value={text}
                  onChange={(e) => onChange({
                    ...value,
                    headlines: setAt(value.headlines, index, e.target.value),
                  })}
                />
                <IconButton
                  size="small"
                  className={styles.removeVariation}
                  onClick={() => onChange({
                    ...value,
                    headlines: removeAt(value.headlines, index),
                  })}
                  aria-label={`Remove headline variation ${index}`}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              </Box>
            )
          })}

          {headlineRemaining > 0 && (
            <Box
              component="button"
              type="button"
              className={styles.addVariation}
              onClick={() => onChange({
                ...value,
                headlines: addAt(value.headlines),
              })}
            >
              <AddCircleOutlineIcon fontSize="small" />
              {`Add headline variation (${value.headlines.length - 1}/${MAX_TOTAL - 1})`}
            </Box>
          )}
        </Box>

        <FormField label="Description">
          <TextField
            multiline
            rows={3}
            size="small"
            variant="outlined"
            fullWidth
            className="density-form"
            placeholder="Enter your ad description here"
            value={value.description}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
          />
        </FormField>

        <FormField label="Destination URL">
          <TextField
            type="url"
            size="small"
            variant="outlined"
            fullWidth
            className="density-form"
            placeholder="https://"
            value={value.url}
            onChange={(e) => onChange({ ...value, url: e.target.value })}
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
}
