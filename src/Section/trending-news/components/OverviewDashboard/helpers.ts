import type { AsyncState, NewsResult } from '@/types'

export function isSuccess(
  state: AsyncState<NewsResult> | undefined,
): state is { status: 'success'; data: NewsResult } {
  return state?.status === 'success'
}
