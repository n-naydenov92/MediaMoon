'use client'

import { memo } from 'react'
import { UserButton } from '@clerk/nextjs'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import ThemeToggle from '@/components/layout/Sidebar/ThemeToggle/ThemeToggle'

/**
 * Bottom section of the sidebar containing the theme toggle and user account button.
 */
export default memo(function SidebarFooter(): JSX.Element {
  return (
    <Stack spacing={3}>
      <ThemeToggle />
      <Box sx={{ px: 2 }}>
        <UserButton afterSignOutUrl="/sign-in" />
      </Box>
    </Stack>
  )
})
