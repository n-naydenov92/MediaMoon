'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined'
import SectionTitle from '../SectionTitle/SectionTitle'
import styles from './EuAdvertiserSection.module.css'

interface Props {
  readonly beneficiary: string
  readonly payor: string
  readonly onBeneficiaryChange: (next: string) => void
  readonly onPayorChange: (next: string) => void
  readonly disabled: boolean
}

export default memo(function EuAdvertiserSection({
  beneficiary,
  payor,
  onBeneficiaryChange,
  onPayorChange,
  disabled,
}: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <SectionTitle icon={<GavelOutlinedIcon fontSize="inherit" />}>
        EU advertiser & payer
      </SectionTitle>

      <Box className={styles.row}>
        <Box className={styles.field}>
          <Typography
            component="label"
            variant="inherit"
            className={styles.label}
            htmlFor="ad-set-editor-beneficiary"
          >
            Beneficiary
          </Typography>
          <TextField
            id="ad-set-editor-beneficiary"
            value={beneficiary}
            onChange={(e) => onBeneficiaryChange(e.target.value)}
            size="small"
            variant="outlined"
            fullWidth
            disabled={disabled}
            className="density-dialog"
            placeholder="Legal name of beneficiary"
          />
        </Box>

        <Box className={styles.field}>
          <Typography
            component="label"
            variant="inherit"
            className={styles.label}
            htmlFor="ad-set-editor-payor"
          >
            Payer
          </Typography>
          <TextField
            id="ad-set-editor-payor"
            value={payor}
            onChange={(e) => onPayorChange(e.target.value)}
            size="small"
            variant="outlined"
            fullWidth
            disabled={disabled}
            className="density-dialog"
            placeholder="Legal name of payer"
          />
        </Box>
      </Box>
    </Box>
  )
})
