'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import type { NavSection, UserRole } from '@/types'
import NavItemView from './NavItemView'
import styles from './SidebarNav.module.css'

interface Props {
  readonly section: NavSection
  readonly brandId: string | null
  readonly role: UserRole
  readonly pathname: string
  readonly onDrillInto: (itemId: string) => void
}

export default memo(function NavSectionView({
  section,
  brandId,
  role,
  pathname,
  onDrillInto,
}: Props): JSX.Element | null {
  const accessibleItems = section.items.filter((item) => item.roles.includes(role))
  if (accessibleItems.length === 0) {
    return null
  }

  return (
    <Box className={styles.section}>
      {section.label !== '' && (
        <Box component="span" className={styles.sectionLabel}>{section.label}</Box>
      )}
      <Box component="ul" className={styles.items}>
        {accessibleItems.map((item) => (
          <Box component="li" key={item.id}>
            <NavItemView
              item={item}
              brandId={brandId}
              pathname={pathname}
              onDrillInto={onDrillInto}
            />
          </Box>
        ))}
      </Box>
    </Box>
  )
})
