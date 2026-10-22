export function normalizeAccountId(id: string): string {
  return id.startsWith('act_') ? id : `act_${id}`
}
