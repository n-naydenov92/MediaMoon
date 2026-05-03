import type { ReactNode } from 'react'

export type NoticeVariant = 'info' | 'error'

interface Props {
  readonly className?: string
  readonly variant: NoticeVariant
  readonly title: ReactNode
  readonly children: ReactNode
}

export default function Notice({ className, variant, title, children }: Props): JSX.Element {
  return (
    <div className={className} data-variant={variant}>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  )
}
