export type SourceState = 'error' | 'ok' | 'empty'

export function resolveState(hasError: boolean, count: number): SourceState {
  if (hasError) {
    return 'error'
  }
  return count > 0 ? 'ok' : 'empty'
}
