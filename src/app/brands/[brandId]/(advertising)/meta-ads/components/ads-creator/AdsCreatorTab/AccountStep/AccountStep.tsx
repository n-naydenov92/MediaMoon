'use client'

import { memo, useMemo } from 'react'
import Box from '@mui/material/Box'
import Image from 'next/image'
import type { AdAccount } from '@/lib/gateways/MetaAdsGateway'
import FormField from '../FormField/FormField'
import SearchSelect from '../SearchSelect/SearchSelect'
import type { TargetingValue } from '../CreatorPane/useTargetingData'
import styles from './AccountStep.module.css'

interface Props {
  readonly accounts: readonly AdAccount[]
  readonly value: TargetingValue
  readonly onChange: (next: TargetingValue) => void
}

function MetaLogo(): JSX.Element {
  return (
    <Image
      src="/icons/meta.svg"
      alt="Meta"
      width={18}
      height={18}
      className={styles.brandIcon}
      priority
    />
  )
}

export default memo(function AccountStep({ accounts, value, onChange }: Props): JSX.Element {
  const selected = useMemo(
    () => accounts.find((a) => a.id === value.accountId) ?? null,
    [accounts, value.accountId],
  )

  return (
    <Box className={styles.root}>
      <FormField label="Ad account" hint="Where these ads will be published">
        <SearchSelect<AdAccount>
          value={selected}
          options={accounts}
          onChange={(next) => onChange({
            ...value,
            accountId: next?.id ?? '',
            campaignId: '',
            adSetId: '',
            instagramId: '',
          })}
          placeholder="Select an Ad Account…"
          leadingIcon={<MetaLogo />}
          getOptionId={(o) => o.id}
          getOptionLabel={(o) => o.name}
          getOptionSecondary={(o) => `(${o.id})`}
          noOptionsText="No ad accounts match this search."
        />
      </FormField>
    </Box>
  )
})
