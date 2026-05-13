import type { NewsCluster } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'
import {
  formatRelative,
  pickLatestPubDate,
} from '@/Section/trending-news/helpers'

export function buildMeta(cluster: NewsCluster): string {
  const parts: string[] = [
    cluster.market,
    `${cluster.coverage} ${LABELS.newsBlock.sources}`,
  ]
  const latestDate = pickLatestPubDate(cluster.articles)
  if (latestDate) {
    parts.push(formatRelative(latestDate))
  }
  return parts.join(' · ')
}
