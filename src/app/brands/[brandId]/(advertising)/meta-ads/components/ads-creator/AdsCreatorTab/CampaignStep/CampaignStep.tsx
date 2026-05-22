'use client'

import { memo, useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import AdsClickOutlinedIcon from '@mui/icons-material/AdsClickOutlined'
import type {
  AdSet,
  Campaign,
  StatusFilter,
} from '@/lib/gateways/MetaAdsGateway'
import SearchSelect, { type OptionStatus } from '../SearchSelect/SearchSelect'
import StatusFilterPills from '../StatusFilterPills/StatusFilterPills'
import DuplicateAdSetTrigger from '../DuplicateAdSetTrigger/DuplicateAdSetTrigger'
import type { TargetingValue } from '../CreatorPane/useTargetingData'
import styles from './CampaignStep.module.css'

interface Props {
  readonly campaigns: readonly Campaign[]
  readonly adSets: readonly AdSet[]
  readonly value: TargetingValue
  readonly onChange: (next: TargetingValue) => void
  readonly campaignStatus: StatusFilter
  readonly onCampaignStatusChange: (next: StatusFilter) => void
  readonly adSetStatus: StatusFilter
  readonly onAdSetStatusChange: (next: StatusFilter) => void
}

function effectiveToOptionStatus(effective: string): OptionStatus {
  return effective === 'ACTIVE' ? 'active' : 'paused'
}

export default memo(function CampaignStep({
  campaigns,
  adSets,
  value,
  onChange,
  campaignStatus,
  onCampaignStatusChange,
  adSetStatus,
  onAdSetStatusChange,
}: Props): JSX.Element {
  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === value.campaignId) ?? null,
    [campaigns, value.campaignId],
  )

  const selectedAdSet = useMemo(
    () => adSets.find((a) => a.id === value.adSetId) ?? null,
    [adSets, value.adSetId],
  )

  return (
    <Box className={styles.root}>
      <Box className={styles.field}>
        <Box className={styles.labelRow}>
          <Typography component="span" variant="inherit" className={styles.fieldLabel}>
            Campaign
          </Typography>
          <StatusFilterPills value={campaignStatus} onChange={onCampaignStatusChange} />
        </Box>
        <SearchSelect<Campaign>
          value={selectedCampaign}
          options={campaigns}
          onChange={(next) => onChange({
            ...value,
            campaignId: next?.id ?? '',
            adSetId: '',
          })}
          placeholder="Select campaign…"
          leadingIcon={<CampaignOutlinedIcon fontSize="small" />}
          disabled={!value.accountId || campaigns.length === 0}
          getOptionId={(o) => o.id}
          getOptionLabel={(o) => o.name}
          getOptionStatus={(o) => effectiveToOptionStatus(o.effectiveStatus)}
          noOptionsText="No campaigns match this search."
        />
      </Box>

      <Box className={styles.field}>
        <Box className={styles.labelRow}>
          <Typography component="span" variant="inherit" className={styles.fieldLabel}>
            Ad set
          </Typography>
          <StatusFilterPills value={adSetStatus} onChange={onAdSetStatusChange} />
        </Box>
        <SearchSelect<AdSet>
          value={selectedAdSet}
          options={adSets}
          onChange={(next) => onChange({ ...value, adSetId: next?.id ?? '' })}
          placeholder="Select ad set…"
          leadingIcon={<AdsClickOutlinedIcon fontSize="small" />}
          disabled={!value.campaignId || adSets.length === 0}
          getOptionId={(o) => o.id}
          getOptionLabel={(o) => o.name}
          getOptionStatus={(o) => effectiveToOptionStatus(o.effectiveStatus)}
          noOptionsText="No ad sets match this search."
        />
        <Box className={styles.adSetActions}>
          <DuplicateAdSetTrigger
            disabled={!value.adSetId}
            accountId={value.accountId}
            sourceAdSetId={value.adSetId}
            sourceAdSetName={selectedAdSet?.name ?? ''}
            sourceCampaignName={selectedCampaign?.name ?? ''}
          />
        </Box>
      </Box>
    </Box>
  )
})
