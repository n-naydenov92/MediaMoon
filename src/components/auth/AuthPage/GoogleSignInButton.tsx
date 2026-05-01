'use client'

import type { MouseEvent } from 'react'
import { GoogleIcon } from './icons'
import styles from './GoogleSignInButton.module.css'

interface GoogleSignInButtonProps {
  readonly label: string
  readonly disabled: boolean
  readonly onClick: () => void
}

export default function GoogleSignInButton({
  label,
  disabled,
  onClick,
}: GoogleSignInButtonProps): JSX.Element {
  const handleClick = (_event: MouseEvent<HTMLButtonElement>): void => {
    onClick()
  }

  return (
    <button
      type="button"
      className={styles.button}
      disabled={disabled}
      onClick={handleClick}
    >
      <GoogleIcon className={styles.icon} />
      <span className={styles.label}>{label}</span>
    </button>
  )
}
