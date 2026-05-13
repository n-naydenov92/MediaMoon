type StatusTone = 'active' | 'inactive' | 'warn'

const STATUS_LABELS: Record<number, { readonly label: string; readonly tone: StatusTone }> = {
  1: { label: 'Active', tone: 'active' },
  2: { label: 'Disabled', tone: 'inactive' },
  3: { label: 'Unsettled', tone: 'warn' },
  7: { label: 'Pending review', tone: 'warn' },
  8: { label: 'Pending settlement', tone: 'warn' },
  9: { label: 'In grace period', tone: 'warn' },
  100: { label: 'Pending closure', tone: 'inactive' },
  101: { label: 'Closed', tone: 'inactive' },
}

export function statusFor(code: number): { readonly label: string; readonly tone: StatusTone } {
  return STATUS_LABELS[code] ?? { label: `Status ${code}`, tone: 'warn' }
}
