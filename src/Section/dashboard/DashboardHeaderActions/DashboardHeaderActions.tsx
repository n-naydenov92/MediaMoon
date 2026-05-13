import { memo } from 'react'
import DateRangeDropdown from '@/app/brands/[brandId]/(advertising)/meta-ads/components/shared/DateRangeDropdown'
import { UpdatedBadge } from '@/components/layout/PageHeader'
import type {
  CustomRange,
  DatePreset,
  DateRangeSelection,
} from '@/lib/meta/dateRange'

interface Props {
  readonly fetchedAt: number | null
  readonly isLoading: boolean
  readonly onRefresh: () => void
  readonly dateSelection: DateRangeSelection
  readonly comparisonEnabled: boolean
  readonly onPresetChange: (next: DatePreset) => void
  readonly onCustomRangeChange: (range: CustomRange) => void
  readonly onComparisonChange: (next: boolean) => void
}

export default memo(function DashboardHeaderActions({
  fetchedAt,
  isLoading,
  onRefresh,
  dateSelection,
  comparisonEnabled,
  onPresetChange,
  onCustomRangeChange,
  onComparisonChange,
}: Props): JSX.Element {
  return (
    <>
      <UpdatedBadge fetchedAt={fetchedAt} onRefresh={onRefresh} disabled={isLoading} />
      <DateRangeDropdown
        value={dateSelection}
        onPresetChange={onPresetChange}
        onCustomRangeChange={onCustomRangeChange}
        comparisonEnabled={comparisonEnabled}
        onComparisonChange={onComparisonChange}
      />
    </>
  )
})
