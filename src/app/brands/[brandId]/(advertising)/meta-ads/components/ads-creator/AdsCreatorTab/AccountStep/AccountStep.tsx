'use client'

import { memo, useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Image from 'next/image'
import {
  accountStatusInfo,
  canAccountServeAds,
  type AdAccount,
} from '@/lib/gateways/MetaAdsGateway'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import { ALL_MARKETS } from '@/lib/markets'
import FormField from '../FormField/FormField'
import SearchSelect from '../SearchSelect/SearchSelect'
import type { TargetingValue } from '../CreatorPane/useTargetingData'
import { withAccount } from '../CreatorPane/helpers'
import { marketPrefixedLabel } from './helpers'
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
  const { markets, metaAccounts, selectedMarket } = useBrandShellContext()
  const showsMarket = selectedMarket === ALL_MARKETS && markets.length > 1
  const selected = useMemo(
    () => accounts.find((a) => a.id === value.accountId) ?? null,
    [accounts, value.accountId],
  )

  const status = selected ? accountStatusInfo(selected.accountStatus) : null
  const serveable = selected ? canAccountServeAds(selected.accountStatus) : true

  return (
    <Box className={styles.root}>
      <FormField label="Ad account">
        <SearchSelect<AdAccount>
          value={selected}
          options={accounts}
          onChange={(next) => onChange(withAccount(value, next?.id ?? ''))}
          placeholder="Select an Ad Account…"
          leadingIcon={<MetaLogo />}
          getOptionId={(o) => o.id}
          getOptionLabel={(o) => (showsMarket ? marketPrefixedLabel(o, metaAccounts) : o.name)}
          getOptionTooltip={(o) => `${o.name} (${o.id})`}
          getOptionStatus={(o) => accountStatusInfo(o.accountStatus).tone}
          getOptionStatusLabel={(o) => accountStatusInfo(o.accountStatus).label}
          noOptionsText="No ad accounts match this search."
        />
        {status && !serveable && (
          <Box className={styles.statusRow}>
            <Typography
              component="span"
              variant="caption"
              color={status.tone === 'inactive' ? 'error' : 'warning.main'}
              className={styles.warning}
            >
              {`This account can’t serve ads while it’s ${status.label} — Meta will reject publishing.`}
            </Typography>
          </Box>
        )}
      </FormField>
    </Box>
  )
})
