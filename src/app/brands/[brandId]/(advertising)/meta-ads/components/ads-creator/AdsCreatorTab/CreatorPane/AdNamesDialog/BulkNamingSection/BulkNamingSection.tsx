'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import FormTextField from '../../../FormTextField/FormTextField'
import type { AdNameTags } from '../../helpers'
import styles from '../AdNamesDialog.module.css'

interface Props {
  readonly open: boolean
  readonly onToggle: () => void
  readonly tags: AdNameTags
  readonly onTagsChange: (next: AdNameTags) => void
  readonly fullName: string
  readonly onFullNameChange: (next: string) => void
}

export default memo(function BulkNamingSection({
  open,
  onToggle,
  tags,
  onTagsChange,
  fullName,
  onFullNameChange,
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
          Bulk tags
        </Typography>
        <ExpandMoreIcon className={styles.chevron} data-open={open ? 'true' : 'false'} fontSize="inherit" />
      </Box>
      <Collapse in={open} timeout={180} unmountOnExit>
        <Box className={styles.bulkFields}>
          <FormTextField
            label="Product"
            className={styles.tagField}
            value={tags.product}
            onChange={(e) => onTagsChange({ ...tags, product: e.target.value })}
          />
          <FormTextField
            label="Creative info"
            className={styles.tagField}
            value={tags.creativeInfo}
            onChange={(e) => onTagsChange({ ...tags, creativeInfo: e.target.value })}
          />
          <FormTextField
            label="Text type"
            className={styles.tagField}
            value={tags.textType}
            onChange={(e) => onTagsChange({ ...tags, textType: e.target.value })}
          />
          <FormTextField
            label="Destination"
            className={styles.tagField}
            value={tags.destination}
            onChange={(e) => onTagsChange({ ...tags, destination: e.target.value })}
          />
        </Box>

        <Box className={styles.bulkDivider} aria-hidden>
          <Typography component="span" variant="caption" color="text.disabled" className={styles.bulkOr}>or</Typography>
        </Box>

        <Box className={`${styles.bulkFields} ${styles.bulkFieldsLast}`}>
          <FormTextField
            label="Full name for all ads"
            className={styles.fullNameField}
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
          />
        </Box>
      </Collapse>
    </Box>
  )
})
