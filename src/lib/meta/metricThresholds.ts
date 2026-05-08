import { classifyRoas } from './roasClassification'

export type MetricTier = 'good' | 'warning' | 'bad' | 'idle'

export const ROAS_GOOD_MIN = 3.5
export const CTR_GOOD_MIN = 0.015
export const CPP_GOOD_MAX = 5
export const CPLPV_GOOD_MAX = 0.5

const CTR_GOOD = CTR_GOOD_MIN
const CTR_WARNING = 0.01

const CPP_WARNING_MAX = 7

const CPLPV_WARNING_MAX = 0.8

export function classifyCtr(ctr: number): MetricTier {
  if (ctr <= 0) {
    return 'idle'
  }
  if (ctr >= CTR_GOOD) {
    return 'good'
  }
  if (ctr >= CTR_WARNING) {
    return 'warning'
  }
  return 'bad'
}

export function classifyCpp(cpp: number): MetricTier {
  if (cpp <= 0) {
    return 'idle'
  }
  if (cpp <= CPP_GOOD_MAX) {
    return 'good'
  }
  if (cpp <= CPP_WARNING_MAX) {
    return 'warning'
  }
  return 'bad'
}

export function classifyCplpv(cplpv: number): MetricTier {
  if (cplpv <= 0) {
    return 'idle'
  }
  if (cplpv <= CPLPV_GOOD_MAX) {
    return 'good'
  }
  if (cplpv <= CPLPV_WARNING_MAX) {
    return 'warning'
  }
  return 'bad'
}

export interface AdMetrics {
  readonly roas: number
  readonly cpp: number
  readonly ctr: number
  readonly cplpv: number
}

export function isWinnerRow(row: AdMetrics): boolean {
  return (
    classifyRoas(row.roas) === 'good' &&
    classifyCpp(row.cpp) === 'good' &&
    classifyCtr(row.ctr) === 'good' &&
    classifyCplpv(row.cplpv) === 'good'
  )
}

export function isUnderperformerRow(row: AdMetrics): boolean {
  return (
    classifyRoas(row.roas) === 'bad' &&
    classifyCpp(row.cpp) === 'bad' &&
    classifyCtr(row.ctr) === 'bad' &&
    classifyCplpv(row.cplpv) === 'bad'
  )
}

export function tierForMetric(id: string, row: AdMetrics): MetricTier | undefined {
  if (id === 'roas') return classifyRoas(row.roas)
  if (id === 'ctr') return classifyCtr(row.ctr)
  if (id === 'cpp') return classifyCpp(row.cpp)
  if (id === 'cplpv') return classifyCplpv(row.cplpv)
  return undefined
}

export interface MetricBenchmark {
  readonly metric: string
  readonly goodLabel: string
  readonly warningLabel: string
  readonly badLabel: string
}

export const METRIC_BENCHMARKS: readonly MetricBenchmark[] = [
  { metric: 'ROAS', goodLabel: '≥ 3.5', warningLabel: '3.0 – 3.5', badLabel: '< 3.0' },
  { metric: 'CPP', goodLabel: '≤ €5', warningLabel: '€5 – €7', badLabel: '> €7' },
  { metric: 'Link CTR', goodLabel: '≥ 1.5%', warningLabel: '1.0% – 1.5%', badLabel: '< 1.0%' },
  { metric: 'CPLPV', goodLabel: '≤ €0.50', warningLabel: '€0.50 – €0.80', badLabel: '> €0.80' },
] as const
