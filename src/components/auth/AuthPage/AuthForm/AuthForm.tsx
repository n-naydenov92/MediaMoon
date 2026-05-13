'use client'

import Box from '@mui/material/Box'
import GoogleSignInButton from '../GoogleSignInButton/GoogleSignInButton'
import { useGoogleAuth, type AuthMode } from '../useGoogleAuth'
import styles from './AuthForm.module.css'

interface AuthFormProps {
  readonly mode: AuthMode
}

const COPY = {
  'sign-in': {
    heading: 'Sign in to MediaMon',
    subtitle: 'Continue with your Google account.',
    button: 'Continue with Google',
    altPrompt: "Don't have an account?",
    altLinkLabel: 'Sign up',
    altHref: '/sign-up',
  },
  'sign-up': {
    heading: 'Create your MediaMon account',
    subtitle: 'Continue with your Google account to get started.',
    button: 'Sign up with Google',
    altPrompt: 'Already have an account?',
    altLinkLabel: 'Sign in',
    altHref: '/sign-in',
  },
} as const

export default function AuthForm({ mode }: AuthFormProps): JSX.Element {
  const copy = COPY[mode]
  const { state, trigger } = useGoogleAuth({ mode })

  const isRedirecting = state.status === 'redirecting'
  const errorMessage = state.status === 'error' ? state.message : null

  const handleClick = (): void => {
    void trigger()
  }

  return (
    <Box component="section" className={styles.panel} aria-labelledby="auth-heading">
      <Box className={styles.content}>
        <Box component="header" className={styles.header}>
          <Box component="h1" id="auth-heading" className={styles.heading}>
            {copy.heading}
          </Box>
          <Box component="p" className={styles.subtitle}>{copy.subtitle}</Box>
        </Box>

        <GoogleSignInButton
          label={copy.button}
          disabled={isRedirecting}
          onClick={handleClick}
        />

        {errorMessage !== null ? (
          <Box component="p" role="alert" className={styles.error}>
            {errorMessage}
          </Box>
        ) : null}

        <Box component="p" className={styles.altPrompt}>
          {`${copy.altPrompt} `}
          <Box component="a" className={styles.altLink} href={copy.altHref}>
            {copy.altLinkLabel}
          </Box>
        </Box>

        <Box component="p" className={styles.terms}>
          By continuing, you agree to our{' '}
          <Box component="a" className={styles.termsLink} href="#">
            Terms of Service
          </Box>
          {' '}and{' '}
          <Box component="a" className={styles.termsLink} href="#">
            Privacy Policy
          </Box>
          .
        </Box>
      </Box>
    </Box>
  )
}
