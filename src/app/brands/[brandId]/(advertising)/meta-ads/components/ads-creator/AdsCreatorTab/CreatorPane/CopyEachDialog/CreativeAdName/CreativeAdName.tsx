'use client'

import { memo, useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import type { Page } from '@/lib/gateways/MetaAdsGateway'
import { adCombos, templateAdName, type AdNaming, type NameableCreative } from '../../../adNaming'
import type { OverrideActions } from '../../../useAdNaming'
import FormField from '../../../FormField/FormField'
import AdNameInput from '../../AdNameInput/AdNameInput'
import styles from './CreativeAdName.module.css'

interface Props {
  readonly pages: readonly Page[]
  readonly creative: NameableCreative | null
  readonly naming: AdNaming
  readonly actions: OverrideActions
}

// The active creative's ad name, edited next to its preview so it's clear which
// creative is being named. Each selected page publishes its own ad, so there is one
// field per page. It writes the same overrides as "Name each ad".
export default memo(function CreativeAdName({
  pages,
  creative,
  naming,
  actions,
}: Props): JSX.Element {
  const combos = useMemo(
    () => (creative ? adCombos(pages, [creative], naming.pageTokens) : []),
    [pages, creative, naming.pageTokens],
  )
  const multiPage = combos.length > 1

  if (combos.length === 0) {
    return (
      <FormField label="Ad name">
        <Typography variant="body2" color="text.disabled">
          Select a page to name this ad
        </Typography>
      </FormField>
    )
  }

  const rows = combos.map((combo) => (
    <Box key={combo.key} className={styles.row}>
      {multiPage && (
        <Box className={styles.pageHead}>
          {combo.page.pictureUrl ? (
            <Box
              component="img"
              src={combo.page.pictureUrl}
              alt=""
              referrerPolicy="no-referrer"
              className={styles.avatar}
            />
          ) : (
            <Box component="span" className={styles.avatarFallback} aria-hidden>
              <StorefrontOutlinedIcon fontSize="inherit" />
            </Box>
          )}
          <Typography component="span" variant="caption" color="text.secondary" noWrap className={styles.pageName}>
            {combo.page.name}
          </Typography>
        </Box>
      )}
      <AdNameInput
        adKey={combo.key}
        templateName={templateAdName(combo, naming.template)}
        override={naming.overrides.get(combo.key)}
        actions={actions}
        ariaLabel={multiPage ? `Ad name on ${combo.page.name}` : 'Ad name'}
      />
    </Box>
  ))
  // Only the first row sits inside the label (as in VariationList): nesting every
  // row would make a tap on any page name focus the first field.
  const [firstRow, ...otherRows] = rows

  return (
    <Box className={styles.root}>
      <FormField label="Ad name" hint={multiPage ? `One per page (${combos.length})` : undefined}>
        {firstRow}
      </FormField>
      {otherRows}
    </Box>
  )
})
