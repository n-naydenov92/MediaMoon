import type { ConnectionProvider } from '@/generated/prisma/enums'

export type AccessModule = 'dashboard' | 'meta-ads' | 'google-ads'

// The dashboard shows whatever the brand has connected, so no single integration switches it on.
const REQUIRED_PROVIDER: Readonly<Record<AccessModule, ConnectionProvider | null>> = {
  dashboard: null,
  'meta-ads': 'META',
  'google-ads': 'GOOGLE_ADS',
}

/** Whether a brand with these integrations has the module at all. */
export function isModuleEnabled(module: AccessModule, providers: readonly ConnectionProvider[]): boolean {
  const required = REQUIRED_PROVIDER[module]
  return required === null || providers.includes(required)
}
