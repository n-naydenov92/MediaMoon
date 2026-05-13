import type { BrandId } from '@/config/brands'
import type { Market } from '@/types'
import type { DateRangeSelection } from '@/lib/meta/dateRange'
import type { ALL_MARKETS } from '@/lib/markets'
import Notice from '../../../Notice/Notice'
import Section from '../../../shared/Section/Section'
import AccountBreakdown from '../AccountBreakdown/AccountBreakdown'
import Leaderboards from '../Leaderboards/Leaderboards'
import SpendChart from '../SpendChart/SpendChart'
import type { OverviewSummary } from '../../useOverviewData'
import styles from '../OverviewTab.module.css'

interface Props {
  readonly summary: OverviewSummary
  readonly brandId: BrandId
  readonly dateSelection: DateRangeSelection
  readonly market: Market | typeof ALL_MARKETS
}

export default function OverviewContent({
  summary,
  brandId,
  dateSelection,
  market,
}: Props): JSX.Element | null {
  const hasAnyData = summary.byAccount.length > 0 || summary.byDay.length > 0
  if (!hasAnyData) {
    return (
      <Notice variant="info" title="No data yet">
        No spend recorded for this brand in the selected range.
      </Notice>
    )
  }
  return (
    <>
      <Section title="Performance Overview" bare>
        <div className={styles.midGrid}>
          <Section title="Daily Trend" className={styles.spendSection}>
            <SpendChart data={summary.byDay} />
          </Section>
          <Section title="Accounts Breakdown" className={styles.accountSection}>
            <AccountBreakdown accounts={summary.byAccount} />
          </Section>
        </div>
      </Section>
      <Section title="Ads Highlights" bare>
        <Leaderboards
          summary={summary}
          brandId={brandId}
          dateSelection={dateSelection}
          market={market}
        />
      </Section>
    </>
  )
}
