import type { BrandId } from '@/config/brands'
import type { Market } from '@/types'
import type { DateRangeSelection } from '@/lib/meta/dateRange'
import { ALL_MARKETS } from '@/lib/markets'
import { formatEur, formatRoas } from '@/lib/meta/fx'
import LeaderboardCard from '../shared/LeaderboardCard'
import { buildPerformanceHref, type LeaderboardSlice } from './performanceHref'
import type { OverviewSummary } from './useOverviewData'
import styles from './Leaderboards.module.css'

interface Props {
  readonly summary: OverviewSummary
  readonly brandId: BrandId
  readonly dateSelection: DateRangeSelection
  readonly market: Market | typeof ALL_MARKETS
}

export default function Leaderboards({
  summary,
  brandId,
  dateSelection,
  market,
}: Props): JSX.Element {
  const hrefFor = (slice: LeaderboardSlice): string =>
    buildPerformanceHref(brandId, dateSelection, market, slice)
  const topSubtitle = `spend over ${formatEur(summary.criteria.minSpend)}, ROAS over ${formatRoas(summary.criteria.topMinRoas)}`
  const underSubtitle = `spend over ${formatEur(summary.criteria.minSpend)}, ROAS under ${formatRoas(summary.criteria.underMaxRoas)}`

  return (
    <div className={styles.grid}>
      <LeaderboardCard
        title="Top creatives"
        subtitle={topSubtitle}
        entries={summary.topAll}
        seeMoreHref={hrefFor('top-all')}
      />
      <LeaderboardCard
        title="Top videos"
        subtitle={topSubtitle}
        entries={summary.topVideos}
        seeMoreHref={hrefFor('top-video')}
      />
      <LeaderboardCard
        title="Top statics"
        subtitle={topSubtitle}
        entries={summary.topImages}
        seeMoreHref={hrefFor('top-image')}
      />
      <LeaderboardCard
        title="Underperformers"
        subtitle={underSubtitle}
        entries={summary.underperformers}
        emptyLabel="No underperformers."
        seeMoreHref={hrefFor('underperformers')}
      />
    </div>
  )
}
