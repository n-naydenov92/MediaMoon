'use client'

import { useMemo, type Dispatch } from 'react'
import type { AttributionWindow, BudgetType, Gender } from '@/lib/gateways/MetaAdsGateway'
import type { DraftAction } from './useAdSetDraft'

export interface DraftHandlers {
  readonly handleNameChange: (value: string) => void
  readonly handleActivateChange: (value: boolean) => void
  readonly handleBudgetTypeChange: (value: BudgetType) => void
  readonly handleBudgetMajorUnitsChange: (value: number) => void
  readonly handleStartTimeChange: (value: string) => void
  readonly handleEndTimeChange: (value: string) => void
  readonly handleAgeChange: (ageMin: number, ageMax: number) => void
  readonly handleGenderChange: (value: Gender) => void
  readonly handleCountriesChange: (value: readonly string[]) => void
  readonly handleAdvantageAudienceChange: (value: boolean) => void
  readonly handleAdvantageAgeChange: (value: boolean) => void
  readonly handleAdvantageGenderChange: (value: boolean) => void
  readonly handleIsDynamicCreativeChange: (value: boolean) => void
  readonly handleDsaBeneficiaryChange: (value: string) => void
  readonly handleDsaPayorChange: (value: string) => void
  readonly handleOptimizationGoalChange: (value: string) => void
  readonly handleBidStrategyChange: (value: string) => void
  readonly handleBidAmountChange: (value: number) => void
  readonly handleDestinationTypeChange: (value: string) => void
  readonly handlePixelIdChange: (value: string) => void
  readonly handleCustomEventTypeChange: (value: string) => void
  readonly handleAttributionSpecChange: (value: readonly AttributionWindow[]) => void
}

// All draft field handlers are thin dispatch wrappers; building them once keeps
// stable references for the memoized section components.
export function useDraftHandlers(dispatch: Dispatch<DraftAction>): DraftHandlers {
  return useMemo<DraftHandlers>(() => ({
    handleNameChange: (value) => dispatch({ type: 'setName', value }),
    handleActivateChange: (value) => dispatch({ type: 'setActivate', value }),
    handleBudgetTypeChange: (value) => dispatch({ type: 'setBudgetType', value }),
    handleBudgetMajorUnitsChange: (value) => dispatch({ type: 'setBudgetMajorUnits', value }),
    handleStartTimeChange: (value) => dispatch({ type: 'setStartTime', value }),
    handleEndTimeChange: (value) => dispatch({ type: 'setEndTime', value }),
    handleAgeChange: (ageMin, ageMax) => dispatch({ type: 'setAgeRange', ageMin, ageMax }),
    handleGenderChange: (value) => dispatch({ type: 'setGender', value }),
    handleCountriesChange: (value) => dispatch({ type: 'setCountries', value }),
    handleAdvantageAudienceChange: (value) => dispatch({ type: 'setAdvantageAudience', value }),
    handleAdvantageAgeChange: (value) => dispatch({ type: 'setAdvantageAge', value }),
    handleAdvantageGenderChange: (value) => dispatch({ type: 'setAdvantageGender', value }),
    handleIsDynamicCreativeChange: (value) => dispatch({ type: 'setIsDynamicCreative', value }),
    handleDsaBeneficiaryChange: (value) => dispatch({ type: 'setDsaBeneficiary', value }),
    handleDsaPayorChange: (value) => dispatch({ type: 'setDsaPayor', value }),
    handleOptimizationGoalChange: (value) => dispatch({ type: 'setOptimizationGoal', value }),
    handleBidStrategyChange: (value) => dispatch({ type: 'setBidStrategy', value }),
    handleBidAmountChange: (value) => dispatch({ type: 'setBidAmountMajorUnits', value }),
    handleDestinationTypeChange: (value) => dispatch({ type: 'setDestinationType', value }),
    handlePixelIdChange: (value) => dispatch({ type: 'setPixelId', value }),
    handleCustomEventTypeChange: (value) => dispatch({ type: 'setCustomEventType', value }),
    handleAttributionSpecChange: (value) => dispatch({ type: 'setAttributionSpec', value }),
  }), [dispatch])
}
