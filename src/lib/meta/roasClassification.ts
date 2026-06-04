export type RoasTier = 'good' | 'warning' | 'bad' | 'idle'

const ROAS_GOOD_THRESHOLD = 3.5
export const ROAS_WARNING_THRESHOLD = 3.0

export function classifyRoas(roas: number): RoasTier {
  if (roas <= 0) {
    return 'idle'
  }
  if (roas >= ROAS_GOOD_THRESHOLD) {
    return 'good'
  }
  if (roas >= ROAS_WARNING_THRESHOLD) {
    return 'warning'
  }
  return 'bad'
}
