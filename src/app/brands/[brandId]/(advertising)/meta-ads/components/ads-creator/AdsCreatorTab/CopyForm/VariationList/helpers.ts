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
