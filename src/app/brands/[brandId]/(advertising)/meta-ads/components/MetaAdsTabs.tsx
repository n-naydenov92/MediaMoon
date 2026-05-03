'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { BrandId } from '@/config/brands'
import styles from './MetaAdsTabs.module.css'

interface Props {
  readonly brandId: BrandId
}

interface TabDefinition {
  readonly slug: string
  readonly label: string
}

const TABS: readonly TabDefinition[] = [
  { slug: 'overview', label: 'Overview' },
  { slug: 'performance', label: 'Ads Performance' },
  { slug: 'launch', label: 'Launch New Ads' },
  { slug: 'insights', label: 'Insights' },
]

export default function MetaAdsTabs({ brandId }: Props): JSX.Element {
  const pathname = usePathname()
  return (
    <nav className={styles.tabs} aria-label="Meta Ads sections">
      {TABS.map((tab) => {
        const href = `/brands/${brandId}/meta-ads/${tab.slug}`
        const isActive = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={tab.slug}
            href={href}
            className={styles.tab}
            data-active={isActive ? 'true' : 'false'}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
