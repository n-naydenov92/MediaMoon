export function pctDelta(
  current: number | null,
  previous: number | null | undefined,
): number | undefined {
  if (
    current === null
    || previous === null
    || previous === undefined
    || previous === 0
  ) {
    return undefined
  }
  return (current - previous) / previous
}
