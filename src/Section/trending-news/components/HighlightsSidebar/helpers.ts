import type { NewsCluster } from '@/types'

const TOP_N = 3

export function pickTop(clusters: readonly NewsCluster[]): readonly NewsCluster[] {
  return [...clusters].sort((a, b) => b.score - a.score).slice(0, TOP_N)
}
