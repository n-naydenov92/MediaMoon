'use client'

import { memo } from 'react'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import type { WorkspaceMemberView } from '@/types/workspace'
import MemberAccessChips from '../MemberAccessChips/MemberAccessChips'
import MemberIdentity from '../MemberIdentity/MemberIdentity'

interface Props {
  readonly member: WorkspaceMemberView
}

export default memo(function MemberRow({ member }: Props): JSX.Element {
  return (
    <TableRow>
      <TableCell>
        <MemberIdentity member={member} />
      </TableCell>
      <TableCell>
        <MemberAccessChips member={member} />
      </TableCell>
    </TableRow>
  )
})
