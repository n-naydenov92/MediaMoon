'use client'

import { memo } from 'react'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Tooltip from '@mui/material/Tooltip'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import FormTextField from '../../FormTextField/FormTextField'
import type { OverrideActions } from '../../useAdNaming'

interface Props {
  readonly adKey: string
  readonly templateName: string
  readonly override: string | undefined
  readonly actions: OverrideActions
  readonly ariaLabel: string
}

// One editable ad name. It shows the template name until typed in; from the first
// keystroke the typed text is an override that template edits no longer touch, until
// it's reset, typed back to the template value, or left blank.
export default memo(function AdNameInput({
  adKey,
  templateName,
  override,
  actions,
  ariaLabel,
}: Props): JSX.Element {
  // The reset button keeps focus in the field (no mousedown blur), so the reset isn't
  // preceded by a blur commit of the text being discarded.
  const resetAdornment = override === undefined ? undefined : (
    <InputAdornment position="end">
      <Tooltip title="Reset to template">
        <IconButton
          size="small"
          edge="end"
          aria-label="Reset to template"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => actions.resetOverride(adKey)}
        >
          <RestartAltOutlinedIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </InputAdornment>
  )

  return (
    <FormTextField
      value={override ?? templateName}
      onChange={(e) => actions.setOverride(adKey, e.target.value, templateName)}
      onBlur={() => actions.commitOverride(adKey, templateName)}
      InputProps={{ endAdornment: resetAdornment, inputProps: { 'aria-label': ariaLabel } }}
    />
  )
})
