'use client'

import { useReducer, type Dispatch } from 'react'
import type {
  AdSetDetail,
  AttributionWindow,
  BudgetType,
  Gender,
} from '@/lib/gateways/MetaAdsGateway'
import { buildDuplicateName, DEFAULT_BID_STRATEGY } from './helpers'

export interface DraftState {
  readonly name: string
  readonly activate: boolean
  readonly budgetType: BudgetType
  readonly budgetMajorUnits: number
  readonly startTime: string
  readonly endTime: string
  readonly ageMin: number
  readonly ageMax: number
  readonly gender: Gender
  readonly countries: readonly string[]
  readonly advantageAudience: boolean
  readonly advantageAge: boolean
  readonly advantageGender: boolean
  readonly isDynamicCreative: boolean
  readonly dsaBeneficiary: string
  readonly dsaPayor: string
  readonly optimizationGoal: string
  readonly bidStrategy: string
  readonly bidAmountMajorUnits: number
  readonly destinationType: string
  readonly pixelId: string
  readonly customEventType: string
  readonly attributionSpec: readonly AttributionWindow[]
}

export type DraftAction =
  | { type: 'reset'; initialName: string }
  | { type: 'hydrate'; source: AdSetDetail }
  | { type: 'setName'; value: string }
  | { type: 'setActivate'; value: boolean }
  | { type: 'setBudgetType'; value: BudgetType }
  | { type: 'setBudgetMajorUnits'; value: number }
  | { type: 'setStartTime'; value: string }
  | { type: 'setEndTime'; value: string }
  | { type: 'setAgeRange'; ageMin: number; ageMax: number }
  | { type: 'setGender'; value: Gender }
  | { type: 'setCountries'; value: readonly string[] }
  | { type: 'setAdvantageAudience'; value: boolean }
  | { type: 'setAdvantageAge'; value: boolean }
  | { type: 'setAdvantageGender'; value: boolean }
  | { type: 'setIsDynamicCreative'; value: boolean }
  | { type: 'setDsaBeneficiary'; value: string }
  | { type: 'setDsaPayor'; value: string }
  | { type: 'setOptimizationGoal'; value: string }
  | { type: 'setBidStrategy'; value: string }
  | { type: 'setBidAmountMajorUnits'; value: number }
  | { type: 'setDestinationType'; value: string }
  | { type: 'setPixelId'; value: string }
  | { type: 'setCustomEventType'; value: string }
  | { type: 'setAttributionSpec'; value: readonly AttributionWindow[] }

const DEFAULT_ATTRIBUTION_SPEC: readonly AttributionWindow[] = [
  { eventType: 'CLICK_THROUGH', windowDays: 7 },
  { eventType: 'VIEW_THROUGH', windowDays: 1 },
  { eventType: 'ENGAGED_VIDEO_VIEW', windowDays: 1 },
]

function emptyDraft(initialName: string): DraftState {
  return {
    name: initialName,
    activate: false,
    budgetType: 'DAILY',
    budgetMajorUnits: 0,
    startTime: '',
    endTime: '',
    ageMin: 18,
    ageMax: 65,
    gender: 'ALL',
    countries: [],
    advantageAudience: true,
    advantageAge: false,
    advantageGender: false,
    isDynamicCreative: false,
    dsaBeneficiary: '',
    dsaPayor: '',
    optimizationGoal: '',
    bidStrategy: DEFAULT_BID_STRATEGY,
    bidAmountMajorUnits: 0,
    destinationType: '',
    pixelId: '',
    customEventType: '',
    attributionSpec: DEFAULT_ATTRIBUTION_SPEC,
  }
}

function reducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'reset':
      return emptyDraft(action.initialName)
    case 'hydrate': {
      const detail = action.source
      // CBO: ad set has no own budget, show the campaign's for context.
      const cbo = detail.campaignBudget !== null && detail.budgetMinorUnits === 0
      const effectiveBudgetType = cbo && detail.campaignBudget
        ? detail.campaignBudget.type
        : detail.budgetType
      const effectiveBudgetMinor = cbo && detail.campaignBudget
        ? detail.campaignBudget.minorUnits
        : detail.budgetMinorUnits
      return {
        name: state.name,
        activate: state.activate,
        budgetType: effectiveBudgetType,
        budgetMajorUnits: effectiveBudgetMinor / 100,
        startTime: detail.startTime ?? '',
        endTime: detail.endTime ?? '',
        ageMin: detail.targeting.ageMin,
        ageMax: detail.targeting.ageMax,
        gender: detail.targeting.gender,
        countries: detail.targeting.countries,
        advantageAudience: detail.targeting.advantageAudience,
        advantageAge: detail.targeting.advantageAge,
        advantageGender: detail.targeting.advantageGender,
        isDynamicCreative: detail.isDynamicCreative,
        dsaBeneficiary: detail.dsaBeneficiary,
        dsaPayor: detail.dsaPayor,
        optimizationGoal: detail.optimizationGoal,
        bidStrategy: detail.bidStrategy,
        bidAmountMajorUnits: detail.bidAmountMinorUnits / 100,
        destinationType: detail.destinationType,
        pixelId: detail.pixelId,
        customEventType: detail.customEventType,
        attributionSpec: detail.attributionSpec,
      }
    }
    case 'setName': return { ...state, name: action.value }
    case 'setActivate': return { ...state, activate: action.value }
    case 'setBudgetType': return { ...state, budgetType: action.value }
    case 'setBudgetMajorUnits': return { ...state, budgetMajorUnits: action.value }
    case 'setStartTime': return { ...state, startTime: action.value }
    case 'setEndTime': return { ...state, endTime: action.value }
    case 'setAgeRange': return { ...state, ageMin: action.ageMin, ageMax: action.ageMax }
    case 'setGender': return { ...state, gender: action.value }
    case 'setCountries': return { ...state, countries: action.value }
    case 'setAdvantageAudience': return { ...state, advantageAudience: action.value }
    case 'setAdvantageAge': return { ...state, advantageAge: action.value }
    case 'setAdvantageGender': return { ...state, advantageGender: action.value }
    case 'setIsDynamicCreative': return { ...state, isDynamicCreative: action.value }
    case 'setDsaBeneficiary': return { ...state, dsaBeneficiary: action.value }
    case 'setDsaPayor': return { ...state, dsaPayor: action.value }
    case 'setOptimizationGoal': return { ...state, optimizationGoal: action.value }
    case 'setBidStrategy': return { ...state, bidStrategy: action.value }
    case 'setBidAmountMajorUnits': return { ...state, bidAmountMajorUnits: action.value }
    case 'setDestinationType': return { ...state, destinationType: action.value }
    case 'setPixelId': return { ...state, pixelId: action.value }
    case 'setCustomEventType': return { ...state, customEventType: action.value }
    case 'setAttributionSpec': return { ...state, attributionSpec: action.value }
    default: return state
  }
}

export function useAdSetDraft(sourceAdSetName: string): [DraftState, Dispatch<DraftAction>] {
  return useReducer(reducer, buildDuplicateName(sourceAdSetName), emptyDraft)
}
