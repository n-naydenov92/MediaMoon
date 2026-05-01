'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function SSOCallbackPage(): React.JSX.Element {
  return <AuthenticateWithRedirectCallback />
}
