import type { ReactNode } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import styles from './BreakdownCard.module.css'

interface Props {
  readonly title: string
  readonly children: ReactNode
  readonly contentClassName?: string
}

export default function BreakdownCard({ title, children, contentClassName }: Props): JSX.Element {
  return (
    <Card variant="outlined" className={styles.card}>
      <CardHeader
        title={title}
        titleTypographyProps={{ variant: 'subtitle1', className: styles.title }}
        className={styles.header}
      />
      <CardContent className={contentClassName ?? styles.content}>{children}</CardContent>
    </Card>
  )
}
