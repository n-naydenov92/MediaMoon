export function setAt(arr: readonly string[], index: number, next: string): readonly string[] {
  const copy = [...arr]
  copy[index] = next
  return copy
}

export function addAt(arr: readonly string[], max: number): readonly string[] {
  if (arr.length >= max) {
    return arr
  }
  return [...arr, '']
}

export function removeAt(arr: readonly string[], index: number): readonly string[] {
  return arr.filter((_, i) => i !== index)
}

export const VARIATION_MAX = 5

// Inject a value from the library: fill the first empty slot, else append a new
// variation up to `max`. Already-present values (compared trimmed) are a no-op so
// the same element can't be added twice.
export function addTextVariation(
  arr: readonly string[],
  value: string,
  max: number = VARIATION_MAX,
): readonly string[] {
  const trimmed = value.trim()
  if (trimmed === '' || hasTextVariation(arr, trimmed)) {
    return arr
  }
  const emptyIndex = arr.findIndex((v) => v.trim() === '')
  if (emptyIndex !== -1) {
    return setAt(arr, emptyIndex, value)
  }
  if (arr.length >= max) {
    return arr
  }
  return [...arr, value]
}

export function hasTextVariation(arr: readonly string[], value: string): boolean {
  const trimmed = value.trim()
  return arr.some((v) => v.trim() === trimmed)
}

export function isVariationListFull(arr: readonly string[], max: number = VARIATION_MAX): boolean {
  return arr.length >= max && arr.every((v) => v.trim() !== '')
}
