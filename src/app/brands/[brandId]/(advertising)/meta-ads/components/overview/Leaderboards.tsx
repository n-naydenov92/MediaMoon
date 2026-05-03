import { formatEur, formatRoas } from '@/lib/meta/fx'
import LeaderboardCard from '../shared/LeaderboardCard'
import type { OverviewSummary } from './useOverviewData'
import styles from './Leaderboards.module.css'

interface Props {
  readonly summary: OverviewSummary
}

export default function Leaderboards({ summary }: Props): JSX.Element {
  const topSubtitle = `spend ≥ ${formatEur(summary.criteria.minSpend)}, ROAS ≥ ${formatRoas(summary.criteria.topMinRoas)}`
  const underSubtitle = `spend ≥ ${formatEur(summary.criteria.minSpend)}, ROAS ≤ ${formatRoas(summary.criteria.underMaxRoas)}`
  return (
    <div className={styles.grid}>
      <LeaderboardCard title="Top all" subtitle={topSubtitle} entries={summary.topAll} />
      <LeaderboardCard title="Top videos" subtitle={topSubtitle} entries={summary.topVideos} />
      <LeaderboardCard title="Top statics" subtitle={topSubtitle} entries={summary.topImages} />
      <LeaderboardCard
        title="Underperformers"
        subtitle={underSubtitle}
        entries={summary.underperformers}
        emptyLabel="No underperformers — nice."
      />
    </div>
  )
}
