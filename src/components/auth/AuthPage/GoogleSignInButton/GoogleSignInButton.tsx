'use client'

import type { MouseEvent } from 'react'
import Box from '@mui/material/Box'
import GoogleIcon from '../icons/GoogleIcon'
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
    <Box
      component="button"
      type="button"
      className={styles.button}
      disabled={disabled}
      onClick={handleClick}
    >
      <GoogleIcon className={styles.icon} />
      <Box component="span" className={styles.label}>{label}</Box>
    </Box>
  )
}
