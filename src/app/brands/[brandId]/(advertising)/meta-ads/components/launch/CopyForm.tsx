'use client'

import { CtaType } from '@prisma/client'
import { BODY_MAX_LENGTH, HEADLINE_MAX_LENGTH } from '@/lib/meta/copyLimits'
import FormField from './FormField'
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

export default function CopyForm({ value, onChange }: Props): JSX.Element {
  return (
    <div className={styles.grid}>
      <FormField label="Headline" hint={`${value.headline.length}/${HEADLINE_MAX_LENGTH}`}>
        <input
          type="text"
          className={styles.input}
          value={value.headline}
          maxLength={HEADLINE_MAX_LENGTH}
          onChange={(e) => onChange({ ...value, headline: e.target.value })}
        />
      </FormField>

      <FormField label="Body" hint={`${value.body.length}/${BODY_MAX_LENGTH}`}>
        <textarea
          className={styles.textarea}
          value={value.body}
          maxLength={BODY_MAX_LENGTH}
          rows={3}
          onChange={(e) => onChange({ ...value, body: e.target.value })}
        />
      </FormField>

      <FormField label="Destination URL">
        <input
          type="url"
          className={styles.input}
          value={value.url}
          placeholder="https://"
          onChange={(e) => onChange({ ...value, url: e.target.value })}
        />
      </FormField>

      <FormField label="Call to action">
        <select
          className={styles.input}
          value={value.cta}
          onChange={(e) => onChange({ ...value, cta: e.target.value as CtaType })}
        >
          {(Object.keys(CTA_LABELS) as CtaType[]).map((cta) => (
            <option key={cta} value={cta}>{CTA_LABELS[cta]}</option>
          ))}
        </select>
      </FormField>
    </div>
  )
}
