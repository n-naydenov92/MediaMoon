'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import FormTextField from '@/components/ui/FormTextField/FormTextField'
import SegmentedControl from '../../../SegmentedControl/SegmentedControl'
import type { AdNameTags, AdNameTemplate, NamingMode } from '../../../adNaming'
import styles from '../AdNamesDialog.module.css'

const MODE_OPTIONS: readonly { readonly value: NamingMode; readonly label: string }[] = [
  { value: 'tags', label: 'Tags' },
  { value: 'custom', label: 'Full name' },
]

const TAG_FIELDS: readonly { readonly field: keyof AdNameTags; readonly label: string }[] = [
  { field: 'product', label: 'Product' },
  { field: 'creativeInfo', label: 'Creative info' },
  { field: 'textType', label: 'Text type' },
  { field: 'destination', label: 'Destination' },
]

interface Props {
  readonly open: boolean
  readonly onToggle: () => void
  readonly template: AdNameTemplate
  readonly onModeChange: (mode: NamingMode) => void
  readonly onTagChange: (field: keyof AdNameTags, value: string) => void
  readonly onCustomNameChange: (value: string) => void
}

// Only the selected mode's fields show and apply, so a filled-in but inactive mode
// can never silently lose to the other one.
export default memo(function BulkNamingSection({
  open,
  onToggle,
  template,
  onModeChange,
  onTagChange,
  onCustomNameChange,
}: Props): JSX.Element {
  return (
    <Box className={styles.bulk}>
      <Box
        component="button"
        type="button"
        className={styles.bulkToggle}
        onClick={onToggle}
        aria-expanded={open}
      >
        <LocalOfferOutlinedIcon className={styles.bulkIcon} fontSize="inherit" />
        <Typography component="span" variant="caption" color="text.secondary" className={styles.bulkTitle}>
          Bulk naming
        </Typography>
        <ExpandMoreIcon className={styles.chevron} data-open={open ? 'true' : 'false'} fontSize="inherit" />
      </Box>
      <Collapse in={open} timeout={180} unmountOnExit>
        <Box className={styles.modeRow}>
          <SegmentedControl<NamingMode>
            value={template.mode}
            options={MODE_OPTIONS}
            onChange={onModeChange}
            ariaLabel="Naming mode"
          />
        </Box>
        <Box className={`${styles.bulkFields} ${styles.bulkFieldsLast}`}>
          {template.mode === 'tags' ? TAG_FIELDS.map(({ field, label }) => (
            <FormTextField
              key={field}
              label={label}
              className={styles.tagField}
              value={template.tags[field]}
              onChange={(e) => onTagChange(field, e.target.value)}
            />
          )) : (
            <FormTextField
              label="Full name for all ads"
              className={styles.fullNameField}
              value={template.customName}
              onChange={(e) => onCustomNameChange(e.target.value)}
            />
          )}
        </Box>
      </Collapse>
    </Box>
  )
})
