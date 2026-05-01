import type { CSSProperties } from 'react'

type CssVarRecord = Record<`--${string}`, string | number>

export function cssVars(vars: CssVarRecord): CSSProperties {
  return vars as CSSProperties
}
