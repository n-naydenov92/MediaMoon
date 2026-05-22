'use client'

import { memo, useMemo, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined'
import InstagramIcon from '@mui/icons-material/Instagram'
import type { InstagramAccount, Page } from '@/lib/gateways/MetaAdsGateway'
import FormField from '../../FormField/FormField'
import SearchSelect from '../SearchSelect/SearchSelect'
import type { TargetingValue } from '../CreatorPane/useTargetingData'
import styles from './ProfilesStep.module.css'

interface Props {
  readonly pages: readonly Page[]
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
  const selectedPage = useMemo(
    () => pages.find((p) => p.id === value.pageId) ?? null,
    [pages, value.pageId],
  )

  const selectedIg = useMemo(
    () => instagramAccounts.find((ig) => ig.id === value.instagramId) ?? null,
    [instagramAccounts, value.instagramId],
  )

  return (
    <Box className={styles.root}>
      <FormField label="Facebook page">
        <SearchSelect<Page>
          value={selectedPage}
          options={pages}
          onChange={(next) => onChange({
            ...value,
            pageId: next?.id ?? '',
            instagramId: '',
          })}
          placeholder="Select page…"
          leadingIcon={<FacebookOutlinedIcon fontSize="small" />}
          disabled={pages.length === 0}
          getOptionId={(o) => o.id}
          getOptionLabel={(o) => o.name}
          getOptionIcon={(o) => renderAvatar(
            o.pictureUrl,
            <FacebookOutlinedIcon fontSize="small" />,
            o.name,
          )}
          noOptionsText="No pages match this search."
        />
      </FormField>

      <FormField label="Instagram account">
        <SearchSelect<InstagramAccount>
          value={selectedIg}
          options={instagramAccounts}
          onChange={(next) => onChange({ ...value, instagramId: next?.id ?? '' })}
          placeholder="Select Instagram…"
          leadingIcon={<InstagramIcon fontSize="small" />}
          disabled={!value.pageId || instagramAccounts.length === 0}
          getOptionId={(o) => o.id}
          getOptionLabel={(o) => `@${o.username}`}
          getOptionIcon={(o) => renderAvatar(
            o.pictureUrl,
            <InstagramIcon fontSize="small" />,
            o.username,
          )}
          noOptionsText="No Instagram accounts match this search."
        />
      </FormField>
    </Box>
  )
})
