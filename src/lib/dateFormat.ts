export function shortDate(value: string): string {
  if (!value) {
    return ''
  }
  const [, month, day] = value.split('-')
  return `${day}/${month}`
}
