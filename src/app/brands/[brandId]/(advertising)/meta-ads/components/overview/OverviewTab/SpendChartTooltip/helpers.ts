import { formatEur, formatRoas } from '@/lib/meta/fx'

const ROAS_KEY = 'roas'

export function formatTooltipValue(key: string, value: number): string {
  if (key === ROAS_KEY) {
    return formatRoas(value)
  }
  return formatEur(value)
}
