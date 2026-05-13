'use client'

import NextLink from 'next/link'
import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import styles from './PageHeader.module.css'

export interface Crumb {
  readonly label: string
  readonly href?: string
}

interface Props {
  readonly crumbs: readonly Crumb[]
  readonly actions?: ReactNode
}

export default function PageHeader({ crumbs, actions }: Props): JSX.Element {
  return (
    <Box component="header" className={styles.root}>
      <Breadcrumbs
        aria-label="Breadcrumb"
        separator={(
          <Box component="span" aria-hidden="true" className={styles.sep}>
            /
          </Box>
        )}
        classes={{ ol: styles.list, li: styles.item, separator: styles.separator }}
        className={styles.crumbs}
      >
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          const key = `${crumb.label}-${index}`
          if (crumb.href && !isLast) {
            return (
              <Link
                key={key}
                component={NextLink}
                href={crumb.href}
                underline="none"
                className={styles.link}
              >
                {crumb.label}
              </Link>
            )
          }
          return (
            <Typography
              key={key}
              component="span"
              variant="body2"
              className={isLast ? styles.current : styles.label}
            >
              {crumb.label}
            </Typography>
          )
        })}
      </Breadcrumbs>
      {actions && <Box className={styles.actions}>{actions}</Box>}
    </Box>
  )
}
