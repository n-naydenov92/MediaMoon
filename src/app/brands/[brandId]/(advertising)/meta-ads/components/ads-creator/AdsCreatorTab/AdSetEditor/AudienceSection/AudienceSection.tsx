'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
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
        />
      </Box>

      <Box className={styles.row}>
        <Box className={styles.field}>
          <FieldLabel>Age</FieldLabel>
          <AgeRangeSlider
            ageMin={ageMin}
            ageMax={ageMax}
            onChange={onAgeChange}
            disabled={disabled}
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
