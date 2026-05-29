'use client'

import { memo, useCallback, useMemo, useState, type ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import AdsClickOutlinedIcon from '@mui/icons-material/AdsClickOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import type {
  AdSet,
  Campaign,
  StatusFilter,
} from '@/lib/gateways/MetaAdsGateway'
import SearchSelect, { type OptionStatus } from '../SearchSelect/SearchSelect'
import StatusFilterPills from '../StatusFilterPills/StatusFilterPills'
import AdSetEditor from '../AdSetEditor/AdSetEditor'
import type { TargetingValue } from '../CreatorPane/useTargetingData'
import styles from './CampaignStep.module.css'

type DuplicateStatus = 'PAUSED' | 'ACTIVE'

// Long ad-set names overflow the Snackbar Alert pill at typical viewport widths.
const TOAST_NAME_MAX_LENGTH = 40

interface SuccessToast {
  readonly message: string
}

interface Props {
  readonly campaigns: readonly Campaign[]
  readonly adSets: readonly AdSet[]
  readonly value: TargetingValue
  readonly onChange: (next: TargetingValue) => void
  readonly campaignStatus: StatusFilter
  readonly onCampaignStatusChange: (next: StatusFilter) => void
  readonly adSetStatus: StatusFilter
  readonly onAdSetStatusChange: (next: StatusFilter) => void
  readonly refetchAdSets: () => void
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
  refetchAdSets,
}: Props): JSX.Element {
  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === value.campaignId) ?? null,
    [campaigns, value.campaignId],
  )

  const selectedAdSet = useMemo(
    () => adSets.find((a) => a.id === value.adSetId) ?? null,
    [adSets, value.adSetId],
  )

  const [duplicateSource, setDuplicateSource] = useState<AdSet | null>(null)
  const closeDuplicateDialog = useCallback(() => setDuplicateSource(null), [])
  const [toast, setToast] = useState<SuccessToast | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

  const openDuplicate = useCallback((adSet: AdSet) => {
    setDuplicateSource(adSet)
    // Blur the trigger before MUI Dialog mounts — otherwise the focused element
    // ends up inside an aria-hidden subtree and React logs a console warning.
    if (typeof document !== 'undefined') {
      const active = document.activeElement
      if (active instanceof HTMLElement) {
        active.blur()
      }
    }
  }, [])

  const handleDuplicateSuccess = useCallback((
    newAdSetId: string,
    newAdSetName: string,
    status: DuplicateStatus,
  ) => {
    refetchAdSets()
    onChange({ ...value, adSetId: newAdSetId })
    const trimmedName = newAdSetName.length > TOAST_NAME_MAX_LENGTH
      ? `${newAdSetName.slice(0, TOAST_NAME_MAX_LENGTH).trimEnd()}…`
      : newAdSetName
    setToast({
      message: status === 'ACTIVE'
        ? `Created "${trimmedName}" — LIVE`
        : `Created "${trimmedName}" — PAUSED`,
    })
  }, [onChange, refetchAdSets, value])

  const renderAdSetRowAction = useCallback((adSet: AdSet): ReactNode => (
    <Tooltip title="Duplicate" placement="top" disableInteractive enterDelay={400}>
      <IconButton
        size="small"
        aria-label={`Duplicate ${adSet.name}`}
        className={styles.duplicateButton}
        onClick={() => openDuplicate(adSet)}
      >
        <ContentCopyIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  ), [openDuplicate])

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
          renderRowAction={renderAdSetRowAction}
          noOptionsText="No ad sets match this search."
        />
      </Box>

      <AdSetEditor
        open={duplicateSource !== null}
        onClose={closeDuplicateDialog}
        onSuccess={handleDuplicateSuccess}
        accountId={value.accountId}
        sourceAdSetId={duplicateSource?.id ?? ''}
        sourceAdSetName={duplicateSource?.name ?? ''}
        sourceCampaignName={selectedCampaign?.name ?? ''}
      />

      <Snackbar
        open={toast !== null}
        autoHideDuration={5000}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={closeToast}
          severity="success"
          variant="filled"
        >
          {toast?.message ?? ''}
        </Alert>
      </Snackbar>
    </Box>
  )
})
