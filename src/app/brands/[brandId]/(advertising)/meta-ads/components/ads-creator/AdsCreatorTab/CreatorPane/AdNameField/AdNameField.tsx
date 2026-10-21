'use client'

import { memo, useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { Page } from '@/lib/gateways/MetaAdsGateway'
import {
  adCombos,
  finalAdName,
  templateAdName,
  type AdNaming,
  type NameableCreative,
} from '../../adNaming'
import type { OverrideActions } from '../../useAdNaming'
import AdNameInput from '../AdNameInput/AdNameInput'
import styles from './AdNameField.module.css'

interface Props {
  readonly pages: readonly Page[]
  readonly creatives: readonly NameableCreative[]
  readonly naming: AdNaming
  readonly actions: OverrideActions
}

// The Copy step's "Ad name" area. A single ad edits its name inline; with several ads
// it shows what the first one publishes as, and the rest are named in the dialog.
export default memo(function AdNameField({
  pages,
  creatives,
  naming,
  actions,
}: Props): JSX.Element {
  const combos = useMemo(
    () => adCombos(pages, creatives, naming.pageTokens),
    [pages, creatives, naming.pageTokens],
  )

  const [first] = combos
  if (!first) {
    return (
      <Typography variant="body2" color="text.disabled">
        Select a page and add creatives to name your ads
      </Typography>
    )
  }

  const firstTemplateName = templateAdName(first, naming.template)
  if (combos.length === 1) {
    return (
      <AdNameInput
        adKey={first.key}
        templateName={firstTemplateName}
        override={naming.overrides.get(first.key)}
        actions={actions}
        ariaLabel="Ad name"
      />
    )
  }

  const editedCount = combos.filter((combo) => naming.overrides.has(combo.key)).length
  const editedLabel = editedCount > 0 ? ` · ${editedCount} edited` : ''

  return (
    <Box className={styles.summary}>
      <Typography variant="body2" noWrap className={styles.firstName}>
        {finalAdName(firstTemplateName, naming.overrides.get(first.key))}
      </Typography>
      <Typography variant="caption" color="text.secondary" className={styles.more}>
        {`+${combos.length - 1} more${editedLabel}`}
      </Typography>
    </Box>
  )
})
