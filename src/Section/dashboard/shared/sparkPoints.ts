import type { SparkPoint } from '@/components/kpi'

export function toSparkPoints<T extends { readonly date: string }>(
  byDay: readonly T[],
  selector: (point: T) => number | null | undefined,
): readonly SparkPoint[] {
  return byDay.map((p) => ({ date: p.date, value: selector(p) ?? 0 }))
}
