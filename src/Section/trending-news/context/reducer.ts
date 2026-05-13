import type { AsyncState, NewsResult } from '@/types'

export interface State {
  readonly dataByKey: ReadonlyMap<string, AsyncState<NewsResult>>
}

export type Action =
  | { type: 'FETCH_START'; key: string }
  | { type: 'FETCH_SUCCESS'; key: string; data: NewsResult }
  | { type: 'FETCH_ERROR'; key: string; message: string }

export function buildInitialState(): State {
  return { dataByKey: new Map() }
}

export function reducer(state: State, action: Action): State {
  // eslint-disable-next-line default-case -- exhaustive enum
  switch (action.type) {
    case 'FETCH_START':
      return { dataByKey: setKey(state.dataByKey, action.key, { status: 'loading' }) }
    case 'FETCH_SUCCESS':
      return {
        dataByKey: setKey(state.dataByKey, action.key, { status: 'success', data: action.data }),
      }
    case 'FETCH_ERROR':
      return {
        dataByKey: setKey(state.dataByKey, action.key, {
          status: 'error',
          message: action.message,
        }),
      }
  }
}

function setKey(
  source: ReadonlyMap<string, AsyncState<NewsResult>>,
  key: string,
  value: AsyncState<NewsResult>,
): ReadonlyMap<string, AsyncState<NewsResult>> {
  const next = new Map(source)
  next.set(key, value)
  return next
}
