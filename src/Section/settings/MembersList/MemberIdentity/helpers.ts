import type { WorkspaceMemberView } from '@/types/workspace'
import { SETTINGS_LABELS } from '../../labels'

type Identity = Pick<WorkspaceMemberView, 'name' | 'email'>

/** The member's name, else their email, so a profile without a name is still recognisable. */
export function displayName({ name, email }: Identity): string {
  return name?.trim() || email || SETTINGS_LABELS.members.unnamed
}

export function initialOf(member: Identity): string {
  return displayName(member).charAt(0).toUpperCase()
}
