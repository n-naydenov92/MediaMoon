import { useMemo } from 'react'
import type { CopyValue } from './CopyForm/CopyForm'
import type { OverridableField } from './perCreativeCopy'

// The set of shared copy fields that currently hold a value, memoized on the
// per-field filled-ness booleans rather than the field values. Its identity only
// changes when a field crosses empty↔filled, so the status badges (and the panes
// that render them) skip re-rendering on every keystroke while typing.
export function useBaseFilled(copy: CopyValue): ReadonlySet<OverridableField> {
  const primary = copy.primaryTexts.some((t) => t.trim() !== '')
  const headline = copy.headlines.some((t) => t.trim() !== '')
  const description = copy.description.trim() !== ''
  const url = copy.url.trim() !== ''
  const cta = copy.cta.trim() !== ''

  return useMemo(() => {
    const filled = new Set<OverridableField>()
    if (primary) filled.add('primaryTexts')
    if (headline) filled.add('headlines')
    if (description) filled.add('description')
    if (url) filled.add('url')
    if (cta) filled.add('cta')
    return filled
  }, [primary, headline, description, url, cta])
}
