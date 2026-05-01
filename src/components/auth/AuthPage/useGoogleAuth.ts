'use client'

import { useCallback, useState } from 'react'
import { useSignIn, useSignUp } from '@clerk/nextjs'

export type AuthMode = 'sign-in' | 'sign-up'

export type GoogleAuthState =
  | { readonly status: 'idle' }
  | { readonly status: 'redirecting' }
  | { readonly status: 'error'; readonly message: string }

interface UseGoogleAuthOptions {
  readonly mode: AuthMode
}

interface UseGoogleAuthResult {
  readonly state: GoogleAuthState
  readonly trigger: () => Promise<void>
}

const OAUTH_STRATEGY = 'oauth_google'
const REDIRECT_URL = '/sso-callback'
const REDIRECT_URL_COMPLETE = '/'
const FALLBACK_ERROR = 'Could not start Google sign-in. Please try again.'

export function useGoogleAuth({ mode }: UseGoogleAuthOptions): UseGoogleAuthResult {
  const { signIn, isLoaded: isSignInLoaded } = useSignIn()
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp()
  const [state, setState] = useState<GoogleAuthState>({ status: 'idle' })

  const trigger = useCallback(async (): Promise<void> => {
    const ready = mode === 'sign-in' ? isSignInLoaded && signIn : isSignUpLoaded && signUp
    if (!ready) {
      return
    }

    setState({ status: 'redirecting' })

    try {
      if (mode === 'sign-in') {
        await signIn!.authenticateWithRedirect({
          strategy: OAUTH_STRATEGY,
          redirectUrl: REDIRECT_URL,
          redirectUrlComplete: REDIRECT_URL_COMPLETE,
        })
      } else {
        await signUp!.authenticateWithRedirect({
          strategy: OAUTH_STRATEGY,
          redirectUrl: REDIRECT_URL,
          redirectUrlComplete: REDIRECT_URL_COMPLETE,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : FALLBACK_ERROR
      setState({ status: 'error', message })
    }
  }, [mode, signIn, signUp, isSignInLoaded, isSignUpLoaded])

  return { state, trigger }
}
