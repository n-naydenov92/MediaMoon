'use client'

import { memo, useMemo, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import InstagramIcon from '@mui/icons-material/Instagram'
import type { InstagramAccount } from '@/lib/gateways/MetaAdsGateway'
import FormField from '../FormField/FormField'
import PagesMultiSelect from '../PagesMultiSelect/PagesMultiSelect'
import SearchSelect from '../SearchSelect/SearchSelect'
import type { TargetingData, TargetingValue } from '../CreatorPane/useTargetingData'
import styles from './ProfilesStep.module.css'

interface Props {
  readonly pages: TargetingData['pages']
  readonly instagramAccounts: readonly InstagramAccount[]
  readonly value: TargetingValue
  readonly onChange: (next: TargetingValue) => void
}

function renderAvatar(url: string | null, fallback: ReactNode, alt: string): ReactNode {
  if (!url) return fallback
  return (
    <Box
      component="img"
      src={url}
      alt={alt}
      referrerPolicy="no-referrer"
      className={styles.avatar}
    />
  )
}

export default memo(function ProfilesStep({
  pages,
  instagramAccounts,
  value,
  onChange,
}: Props): JSX.Element {
  const isSinglePage = value.pageIds.length === 1
  const isMultiPage = value.pageIds.length >= 2

  const selectedIg = useMemo(
    () => instagramAccounts.find((ig) => ig.id === value.instagramId) ?? null,
    [instagramAccounts, value.instagramId],
  )

  return (
    <Box className={styles.root}>
      <FormField label="Facebook pages">
        <PagesMultiSelect
          options={pages}
          value={value.pageIds}
          onChange={(nextIds) => onChange({
            ...value,
            pageIds: nextIds,
            instagramId: nextIds.length === 1 ? value.instagramId : '',
          })}
        />
      </FormField>

      <FormField label="Instagram account">
        {isMultiPage ? (
          <SearchSelect<InstagramAccount>
            value={null}
            options={[]}
            onChange={() => {}}
            placeholder="Instagram profiles mapped automatically"
            leadingIcon={<InstagramIcon fontSize="small" />}
            disabled
            getOptionId={(o) => o.id}
            getOptionLabel={(o) => o.username}
          />
        ) : (
          <SearchSelect<InstagramAccount>
            value={selectedIg}
            options={instagramAccounts}
            onChange={(next) => onChange({ ...value, instagramId: next?.id ?? '' })}
            placeholder="Select Instagram…"
            leadingIcon={<InstagramIcon fontSize="small" />}
            disabled={!isSinglePage || instagramAccounts.length === 0}
            getOptionId={(o) => o.id}
            getOptionLabel={(o) => `@${o.username}`}
            getOptionIcon={(o) => renderAvatar(
              o.pictureUrl,
              <InstagramIcon fontSize="small" />,
              o.username,
            )}
            noOptionsText="No Instagram accounts match this search."
          />
        )}
      </FormField>
    </Box>
  )
})
