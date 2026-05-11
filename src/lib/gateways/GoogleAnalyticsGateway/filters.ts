import type { MarketSelection } from '@/lib/markets'
import type { FilterExpression } from './types'

export function buildCountryFilter(market: MarketSelection): FilterExpression | undefined {
  if (market === 'ALL') {
    return undefined
  }
  return {
    filter: {
      fieldName: 'countryId',
      stringFilter: { matchType: 'EXACT', value: market },
    },
  }
}

export function eventInListFilter(events: readonly string[]): FilterExpression {
  return {
    filter: {
      fieldName: 'eventName',
      inListFilter: { values: [...events] },
    },
  }
}

export function composeAnd(
  a: FilterExpression,
  b: FilterExpression | undefined,
): FilterExpression {
  if (!b) {
    return a
  }
  return { andGroup: { expressions: [a, b] } }
}
