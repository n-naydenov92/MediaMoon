'use client'

import { memo } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import Box from '@mui/material/Box'
import ThemeToggleButton from './ThemeToggleButton/ThemeToggleButton'
import styles from './SidebarUserCard.module.css'

interface Props {
  readonly variant: 'fixed' | 'drawer'
}

export default memo(function SidebarUserCard({ variant: _variant }: Props): JSX.Element {
  const { user } = useUser()
  const displayName =
    user?.fullName ?? user?.username ?? user?.primaryEmailAddress?.emailAddress ?? ''

  return (
    <Box className={styles.root}>
      <Box className={styles.avatar}>
        <UserButton afterSignOutUrl="/sign-in" />
      </Box>
      <Box component="span" className={styles.name} title={displayName}>
        {displayName}
      </Box>
      <ThemeToggleButton />
    </Box>
  )
})
