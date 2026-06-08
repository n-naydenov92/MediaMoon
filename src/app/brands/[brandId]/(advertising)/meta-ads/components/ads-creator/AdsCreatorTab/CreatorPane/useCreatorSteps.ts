'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { firstIncomplete, STEP_IDS, type Completion, type StepId } from './helpers'

export interface CreatorSteps {
  readonly expanded: ReadonlySet<StepId>
  readonly toggleHandlers: Record<StepId, () => void>
}

// The accordion expansion state machine: which steps are open, plus auto-advance —
// when a step that gates the flow (account, campaign) becomes complete while open, it
// closes and the next incomplete step opens. profiles/files/copy are left open on
// completion so the operator can keep editing them.
export function useCreatorSteps(completion: Completion): CreatorSteps {
  const [expanded, setExpanded] = useState<ReadonlySet<StepId>>(() => {
    const fi = firstIncomplete(completion)
    return fi ? new Set<StepId>([fi]) : new Set<StepId>()
  })

  const toggle = useCallback((id: StepId) => {
    setExpanded((curr) => {
      const next = new Set(curr)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // One stable handler per step so the memoized StepAccordions don't re-render on
  // every keystroke (an inline `() => toggle(id)` would break their memo each time).
  const toggleHandlers = useMemo(() => {
    const map = {} as Record<StepId, () => void>
    for (const id of STEP_IDS) {
      map[id] = () => toggle(id)
    }
    return map
  }, [toggle])

  const prevCompletionRef = useRef<Completion>(completion)
  useEffect(() => {
    const prev = prevCompletionRef.current
    prevCompletionRef.current = completion
    setExpanded((curr) => {
      let next = curr
      for (const id of STEP_IDS) {
        if (id === 'profiles' || id === 'files' || id === 'copy') continue
        if (!prev[id] && completion[id] && curr.has(id)) {
          const cleaned = new Set(curr)
          cleaned.delete(id)
          const fi = firstIncomplete(completion)
          if (fi && !cleaned.has(fi)) {
            cleaned.add(fi)
          }
          next = cleaned
        }
      }
      return next
    })
  }, [completion])

  return { expanded, toggleHandlers }
}
