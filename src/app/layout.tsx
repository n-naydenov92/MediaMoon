import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { DM_Sans, Syne } from 'next/font/google'
import { ThemeModeProvider } from '@/styles/ThemeModeProvider'
import AppShell from '@/components/layout/AppShell/AppShell'
import { getCurrentUserRole } from '@/lib/currentUserRole'
import { getModulesForRole } from '@/config/modules'
import { BRAND_REGISTRY } from '@/config/brands'
import '@/styles/globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['500', '600', '700'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'MediaMon',
  description: 'Internal media monitoring platform',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

interface Props {
  readonly children: ReactNode
}

export default async function RootLayout({ children }: Props): Promise<JSX.Element> {
  const role = await getCurrentUserRole()
  const modules = role ? getModulesForRole(role) : []

  return (
    <ClerkProvider>
      <html lang="en" className={`${syne.variable} ${dmSans.variable}`} suppressHydrationWarning>
        <body>
          <ThemeModeProvider>
            <AppShell modules={modules} brands={BRAND_REGISTRY} role={role}>{children}</AppShell>
          </ThemeModeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
