'use client'

import { memo, useState } from 'react'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import Switch from '@mui/material/Switch'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import styles from './AdvantagePlusToggles.module.css'

interface Props {
  readonly advantageAudience: boolean
  readonly advantageAge: boolean
  readonly advantageGender: boolean
  readonly onAdvantageAudienceChange: (next: boolean) => void
  readonly onAdvantageAgeChange: (next: boolean) => void
  readonly onAdvantageGenderChange: (next: boolean) => void
  readonly disabled: boolean
}

interface Row {
  readonly title: string
  readonly description: string
  readonly checked: boolean
  readonly onChange: (next: boolean) => void
}

export default memo(function AdvantagePlusToggles({
  advantageAudience,
  advantageAge,
  advantageGender,
  onAdvantageAudienceChange,
  onAdvantageAgeChange,
  onAdvantageGenderChange,
  disabled,
}: Props): JSX.Element {
  const [open, setOpen] = useState<boolean>(false)

  const rows: readonly Row[] = [
    {
      title: 'Advantage+ audience',
      description: 'Let Meta expand beyond your targeting when it predicts better results.',
      checked: advantageAudience,
      onChange: onAdvantageAudienceChange,
    },
    {
      title: 'Advantage age',
      description: 'Meta may show ads outside your age range when likely to perform better.',
      checked: advantageAge,
      onChange: onAdvantageAgeChange,
    },
    {
      title: 'Advantage gender',
      description: 'Meta may show ads outside your gender selection when likely to perform better.',
      checked: advantageGender,
      onChange: onAdvantageGenderChange,
    },
  ]

  return (
    <Box className={styles.root}>
      <Box
        component="button"
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        aria-expanded={open}
      >
        <Typography component="span" variant="inherit" className={styles.title}>
          Advantage+ audience
        </Typography>
        <ExpandMoreOutlinedIcon
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          fontSize="small"
        />
      </Box>

      <Collapse in={open} timeout={200} unmountOnExit>
        <Box className={styles.rows}>
          {rows.map((row) => (
            <Box key={row.title} className={styles.row}>
              <Box className={styles.text}>
                <Typography component="span" variant="inherit" className={styles.rowTitle}>
                  {row.title}
                </Typography>
                <Typography component="span" variant="inherit" className={styles.description}>
                  {row.description}
                </Typography>
              </Box>
              <Tooltip title={row.checked ? 'On' : 'Off'} placement="top" disableInteractive>
                <Switch
                  checked={row.checked}
                  onChange={(_, next) => row.onChange(next)}
                  disabled={disabled}
                  inputProps={{ 'aria-label': row.title }}
                />
              </Tooltip>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  )
})
