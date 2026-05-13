'use client'

import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { CtaType } from '@prisma/client'
import { BODY_MAX_LENGTH, HEADLINE_MAX_LENGTH } from '@/lib/meta/copyLimits'
import FormField from '../../FormField/FormField'
import styles from './CopyForm.module.css'

export interface CopyValue {
  readonly headline: string
  readonly body: string
  readonly url: string
  readonly cta: CtaType
}

interface Props {
  readonly value: CopyValue
  readonly onChange: (next: CopyValue) => void
}

const CTA_LABELS: Record<CtaType, string> = {
  LEARN_MORE: 'Learn more',
  SHOP_NOW: 'Shop now',
  SIGN_UP: 'Sign up',
}

const SELECT_PROPS = {
  MenuProps: {
    slotProps: { paper: { className: styles.menuPaper } },
    MenuListProps: { className: styles.menuList },
  },
} as const

export default function CopyForm({ value, onChange }: Props): JSX.Element {
  return (
    <Box className={styles.grid}>
      <FormField label="Headline" hint={`${value.headline.length}/${HEADLINE_MAX_LENGTH}`}>
        <TextField
          type="text"
          size="small"
          variant="outlined"
          fullWidth
          className={styles.input}
          value={value.headline}
          inputProps={{ maxLength: HEADLINE_MAX_LENGTH }}
          onChange={(e) => onChange({ ...value, headline: e.target.value })}
        />
      </FormField>

      <FormField label="Body" hint={`${value.body.length}/${BODY_MAX_LENGTH}`}>
        <TextField
          multiline
          minRows={3}
          size="small"
          variant="outlined"
          fullWidth
          className={styles.textarea}
          value={value.body}
          inputProps={{ maxLength: BODY_MAX_LENGTH }}
          onChange={(e) => onChange({ ...value, body: e.target.value })}
        />
      </FormField>

      <FormField label="Destination URL">
        <TextField
          type="url"
          size="small"
          variant="outlined"
          fullWidth
          placeholder="https://"
          className={styles.input}
          value={value.url}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
        />
      </FormField>

      <FormField label="Call to action">
        <TextField
          select
          size="small"
          variant="outlined"
          fullWidth
          className={styles.input}
          value={value.cta}
          SelectProps={SELECT_PROPS}
          onChange={(e) => onChange({ ...value, cta: e.target.value as CtaType })}
        >
          {(Object.keys(CTA_LABELS) as CtaType[]).map((cta) => (
            <MenuItem key={cta} value={cta}>{CTA_LABELS[cta]}</MenuItem>
          ))}
        </TextField>
      </FormField>
    </Box>
  )
}
