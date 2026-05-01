'use client'

import GoogleSignInButton from './GoogleSignInButton'
import { useGoogleAuth, type AuthMode } from './useGoogleAuth'
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
    <section className={styles.panel} aria-labelledby="auth-heading">
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 id="auth-heading" className={styles.heading}>
            {copy.heading}
          </h1>
          <p className={styles.subtitle}>{copy.subtitle}</p>
        </header>

        <GoogleSignInButton
          label={copy.button}
          disabled={isRedirecting}
          onClick={handleClick}
        />

        {errorMessage !== null ? (
          <p role="alert" className={styles.error}>
            {errorMessage}
          </p>
        ) : null}

        <p className={styles.altPrompt}>
          {copy.altPrompt}{' '}
          <a className={styles.altLink} href={copy.altHref}>
            {copy.altLinkLabel}
          </a>
        </p>

        <p className={styles.terms}>
          By continuing, you agree to our{' '}
          <a className={styles.termsLink} href="#">
            Terms of Service
          </a>{' '}
          and{' '}
          <a className={styles.termsLink} href="#">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </section>
  )
}
