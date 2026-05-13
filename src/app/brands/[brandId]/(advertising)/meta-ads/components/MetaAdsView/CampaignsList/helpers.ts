export function toneFor(effectiveStatus: string): 'active' | 'inactive' | 'warn' {
  if (effectiveStatus === 'ACTIVE') return 'active'
  if (
    effectiveStatus === 'PAUSED'
    || effectiveStatus === 'ARCHIVED'
    || effectiveStatus === 'DELETED'
  ) {
    return 'inactive'
  }
  return 'warn'
}
