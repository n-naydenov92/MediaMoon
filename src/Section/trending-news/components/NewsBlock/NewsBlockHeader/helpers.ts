import type { NewsCluster } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'
import {
  formatRelative,
  pickLatestPubDate,
  pickTopSources,
} from '@/Section/trending-news/helpers'

export function buildSubline(cluster: NewsCluster): string {
  const latestDate = pickLatestPubDate(cluster.articles)
  const sources = pickTopSources(cluster.articles)
  const parts: string[] = [`${cluster.coverage} ${LABELS.newsBlock.sources}`]
  if (latestDate) {
    parts.push(`${LABELS.newsBlock.last} ${formatRelative(latestDate)}`)
  }
  if (sources) {
    parts.push(sources)
  }
  return parts.join(' · ')
}
