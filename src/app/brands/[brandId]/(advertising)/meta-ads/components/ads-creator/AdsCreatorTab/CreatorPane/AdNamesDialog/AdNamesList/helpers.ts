import { finalAdName, type AdCombo } from '../../../adNaming'

export interface AdNameListRow {
  readonly combo: AdCombo
  readonly templateName: string
}

// Keys of ads that would publish under the same name as another ad. Meta accepts
// duplicates, but such ads can't be told apart in reporting — so it's a warning,
// not a blocker.
export function duplicateAdKeys(
  rows: readonly AdNameListRow[],
  overrides: ReadonlyMap<string, string>,
): ReadonlySet<string> {
  const keysByName = new Map<string, string[]>()
  rows.forEach(({ combo, templateName }) => {
    const name = finalAdName(templateName, overrides.get(combo.key))
    keysByName.set(name, [...(keysByName.get(name) ?? []), combo.key])
  })
  return new Set([...keysByName.values()].filter((keys) => keys.length > 1).flat())
}
