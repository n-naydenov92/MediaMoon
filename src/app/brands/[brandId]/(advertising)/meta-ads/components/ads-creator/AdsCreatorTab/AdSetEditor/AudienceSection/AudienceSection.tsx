'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { Gender } from '@/lib/gateways/MetaAdsGateway'
import AdvantageBadge from '../AdvantageBadge/AdvantageBadge'
import AgeRangeSlider from './AgeRangeSlider/AgeRangeSlider'
import FieldLabel from '../FieldLabel/FieldLabel'
import SectionTitle from '../SectionTitle/SectionTitle'
import SegmentedControl from '../SegmentedControl/SegmentedControl'
import AdvantagePlusToggles from './AdvantagePlusToggles/AdvantagePlusToggles'
import LocationsField from './LocationsField/LocationsField'
import styles from './AudienceSection.module.css'

interface Props {
  readonly ageMin: number
  readonly ageMax: number
  readonly gender: Gender
  readonly countries: readonly string[]
  readonly advantageAudience: boolean
  readonly advantageAge: boolean
  readonly advantageGender: boolean
  readonly onAgeChange: (ageMin: number, ageMax: number) => void
  readonly onGenderChange: (next: Gender) => void
  readonly onCountriesChange: (next: readonly string[]) => void
  readonly onAdvantageAudienceChange: (next: boolean) => void
  readonly onAdvantageAgeChange: (next: boolean) => void
  readonly onAdvantageGenderChange: (next: boolean) => void
  readonly disabled: boolean
  readonly countriesError?: string
}

const GENDER_OPTIONS: readonly { value: Gender; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'MEN', label: 'Men' },
  { value: 'WOMEN', label: 'Women' },
]

export default memo(function AudienceSection({
  ageMin,
  ageMax,
  gender,
  countries,
  advantageAudience,
  advantageAge,
  advantageGender,
  onAgeChange,
  onGenderChange,
  onCountriesChange,
  onAdvantageAudienceChange,
  onAdvantageAgeChange,
  onAdvantageGenderChange,
  disabled,
  countriesError,
}: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <Box className={styles.titleRow}>
        <SectionTitle icon={<GroupsOutlinedIcon fontSize="inherit" />}>
          Audience
        </SectionTitle>
        <AdvantageBadge on={advantageAudience} />
      </Box>

      <Box className={styles.field}>
        <FieldLabel>Locations</FieldLabel>
        <LocationsField
          countries={countries}
          onChange={onCountriesChange}
          disabled={disabled}
          error={countriesError}
        />
      </Box>

      <Box className={styles.row}>
        <Box className={styles.field}>
          <Box className={styles.labelRow}>
            <FieldLabel>Age</FieldLabel>
            {advantageAudience && (
              <Tooltip
                title="With Advantage+ audience on, Meta locks the maximum age at 65. Turn it off to set a lower maximum age."
                placement="top"
                arrow
              >
                <Box component="span" className={styles.infoIcon} tabIndex={0} aria-label="Why is max age locked?">
                  <InfoOutlinedIcon fontSize="inherit" />
                </Box>
              </Tooltip>
            )}
          </Box>
          <AgeRangeSlider
            ageMin={ageMin}
            ageMax={ageMax}
            onChange={onAgeChange}
            disabled={disabled}
            maxLocked={advantageAudience}
          />
        </Box>

        <Box className={styles.field}>
          <FieldLabel>Gender</FieldLabel>
          <SegmentedControl<Gender>
            value={gender}
            options={GENDER_OPTIONS}
            onChange={onGenderChange}
            disabled={disabled}
            ariaLabel="Gender"
            fullWidth
          />
        </Box>
      </Box>

      <AdvantagePlusToggles
        advantageAudience={advantageAudience}
        advantageAge={advantageAge}
        advantageGender={advantageGender}
        onAdvantageAudienceChange={onAdvantageAudienceChange}
        onAdvantageAgeChange={onAdvantageAgeChange}
        onAdvantageGenderChange={onAdvantageGenderChange}
        disabled={disabled}
      />
    </Box>
  )
})
