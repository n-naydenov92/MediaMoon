import { useMemo, useState } from 'react'
import type { FilterRule } from '@/lib/meta/filterRules'
import { isServerFilterField, type ElementTabId, type PresetDef, type PresetKey } from './config'
import { activePresetKey } from './helpers'
import { cardMetricFields, type CardMetricField } from './MetricList/helpers'

const INITIAL_RULES: Record<ElementTabId, readonly FilterRule[]> = {
  creatives: [],
  primary: [],
  headline: [],
  urls: [],
}

export interface LibraryFilters {
  readonly rules: readonly FilterRule[]
  readonly serverRules: readonly FilterRule[]
  readonly viewRules: readonly FilterRule[]
  readonly activePreset: PresetKey | null
  readonly cardFields: readonly CardMetricField[]
  readonly selectPreset: (key: PresetKey) => void
  readonly addRule: (rule: FilterRule) => void
  readonly updateRule: (index: number, rule: FilterRule) => void
  readonly removeRule: (index: number) => void
}

// Per-tab filter rules. spend/impressions are split out as `serverRules` (drive a
// re-fetch); the rest are `viewRules` (client-side). `cardFields` mirrors the rules
// so the metric strip shows exactly what the user filters on.
export function useLibraryFilters(
  activeTab: ElementTabId,
  presets: readonly PresetDef[],
): LibraryFilters {
  const [rulesByTab, setRulesByTab] = useState<Record<ElementTabId, readonly FilterRule[]>>(
    INITIAL_RULES,
  )
  const rules = rulesByTab[activeTab]

  const serverRules = useMemo(() => rules.filter((r) => isServerFilterField(r.field)), [rules])
  const viewRules = useMemo(() => rules.filter((r) => !isServerFilterField(r.field)), [rules])
  const cardFields = useMemo(() => cardMetricFields(rules), [rules])
  const activePreset = activePresetKey(rules, presets)

  function selectPreset(key: PresetKey): void {
    const preset = presets.find((p) => p.key === key)
    if (!preset) {
      return
    }
    setRulesByTab((prev) => ({ ...prev, [activeTab]: preset.rules }))
  }

  function addRule(rule: FilterRule): void {
    setRulesByTab((prev) => ({ ...prev, [activeTab]: [...prev[activeTab], rule] }))
  }

  function updateRule(index: number, rule: FilterRule): void {
    setRulesByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((r, i) => (i === index ? rule : r)),
    }))
  }

  function removeRule(index: number): void {
    setRulesByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].filter((_, i) => i !== index),
    }))
  }

  return {
    rules,
    serverRules,
    viewRules,
    activePreset,
    cardFields,
    selectPreset,
    addRule,
    updateRule,
    removeRule,
  }
}
