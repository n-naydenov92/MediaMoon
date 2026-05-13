import type { CSSProperties } from 'react'

type CssVarRecord = Record<`--${string}`, string | number>

export function cssVars(vars: CssVarRecord): CSSProperties {
  return vars
}

export function cls(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
