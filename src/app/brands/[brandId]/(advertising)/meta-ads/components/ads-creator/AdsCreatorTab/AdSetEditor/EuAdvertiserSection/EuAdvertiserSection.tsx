'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined'
import SectionTitle from '../SectionTitle/SectionTitle'
import DsaField from './DsaField/DsaField'
import styles from './EuAdvertiserSection.module.css'

interface Props {
  readonly beneficiary: string
  readonly payor: string
  readonly beneficiaryOptions: readonly string[]
  readonly payorOptions: readonly string[]
  readonly onBeneficiaryChange: (next: string) => void
  readonly onPayorChange: (next: string) => void
  readonly disabled: boolean
  readonly beneficiaryError?: string
  readonly payorError?: string
}

export default memo(function EuAdvertiserSection({
  beneficiary,
  payor,
  beneficiaryOptions,
  payorOptions,
  onBeneficiaryChange,
  onPayorChange,
  disabled,
  beneficiaryError,
  payorError,
}: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <SectionTitle icon={<GavelOutlinedIcon fontSize="inherit" />}>
        EU advertiser & payer
      </SectionTitle>

      <Box className={styles.row}>
        <DsaField
          label="Beneficiary"
          fieldId="ad-set-editor-beneficiary"
          value={beneficiary}
          options={beneficiaryOptions}
          onChange={onBeneficiaryChange}
          disabled={disabled}
          placeholder="Legal name of beneficiary"
          error={beneficiaryError}
        />
        <DsaField
          label="Payer"
          fieldId="ad-set-editor-payor"
          value={payor}
          options={payorOptions}
          onChange={onPayorChange}
          disabled={disabled}
          placeholder="Legal name of payer"
          error={payorError}
        />
      </Box>
    </Box>
  )
})
