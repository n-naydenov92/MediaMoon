'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import ArrowBackIcon from '@mui/icons-material/ArrowBackIos'
import type { NavPanel, UserRole } from '@/types'
import NavSectionView from './NavSectionView'
import styles from './SidebarNav.module.css'

interface Props {
  readonly panel: NavPanel
  readonly brandId: string | null
  readonly role: UserRole
  readonly pathname: string
  readonly showBackButton: boolean
  readonly onBack: () => void
  readonly onDrillInto: (itemId: string) => void
}

export default memo(function NavPanelView({
  panel,
  brandId,
  role,
  pathname,
  showBackButton,
  onBack,
  onDrillInto,
}: Props): JSX.Element {
  return (
    <Box component="nav" className={styles.panel} aria-label={panel.title || 'Navigation'}>
      {showBackButton && (
        <Box
          component="button"
          type="button"
          className={styles.backButton}
          onClick={onBack}
          aria-label={`Back from ${panel.title}`}
        >
          <ArrowBackIcon className={styles.backIcon} fontSize="inherit" />
          <Box component="span" className={styles.backTitle}>{panel.title}</Box>
        </Box>
      )}
      <Box className={styles.sections}>
        {panel.sections.map((section) => (
          <NavSectionView
            key={section.id}
            section={section}
            brandId={brandId}
            role={role}
            pathname={pathname}
            onDrillInto={onDrillInto}
          />
        ))}
      </Box>
    </Box>
  )
})
