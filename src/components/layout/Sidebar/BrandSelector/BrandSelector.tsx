'use client'

import { memo, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import type { SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { BrandConfig, ModuleConfig } from '@/types'
import { LABELS } from '@/components/layout/labels'
import BrandHeader from '@/components/layout/Sidebar/BrandSelector/BrandHeader'
import BrandModuleLinks from '@/components/layout/Sidebar/BrandSelector/BrandModuleLinks'

const OVERVIEW_VALUE = '__overview__'
const SWITCHER_LABEL = 'Switch brand'
const BRAND_PATH_REGEX = /^\/brands\/([^/]+)/

interface Props {
  readonly brands: readonly BrandConfig[]
  readonly modules: readonly ModuleConfig[]
}

export default memo(function BrandSelector({ brands, modules }: Props): JSX.Element {
  const pathname = usePathname()
  const router = useRouter()

  const activeBrand = resolveActiveBrand(pathname, brands)
  const selectValue = activeBrand?.id ?? OVERVIEW_VALUE

  const handleChange = useCallback(
    (event: SelectChangeEvent<string>): void => {
      const value = event.target.value
      if (value === OVERVIEW_VALUE) {
        router.push('/brands')
        return
      }
      const firstModule = modules[0]
      if (firstModule) {
        router.push(`/brands/${value}/${firstModule.id}`)
      }
    },
    [router, modules],
  )

  return (
    <Stack spacing={3}>
      {activeBrand && <BrandHeader brand={activeBrand} />}

      <FormControl size="small" fullWidth>
        <Select
          value={selectValue}
          onChange={handleChange}
          displayEmpty
          aria-label={SWITCHER_LABEL}
          sx={{ fontSize: 13 }}
          renderValue={() => (
            <Typography variant="body2" color="text.secondary">
              {activeBrand ? SWITCHER_LABEL : LABELS.sidebar.overview}
            </Typography>
          )}
        >
          <MenuItem value={OVERVIEW_VALUE}>
            <Typography variant="body2" color="text.secondary">
              {LABELS.sidebar.overview}
            </Typography>
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          {brands.map((brand) => (
            <MenuItem key={brand.id} value={brand.id}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  component="span"
                  sx={{ fontSize: 16, lineHeight: 1, width: 20, textAlign: 'center' }}
                >
                  {brand.emoji}
                </Box>
                <Typography variant="body2">{brand.label}</Typography>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {activeBrand && (
        <>
          <Divider />
          <BrandModuleLinks brandId={activeBrand.id} modules={modules} />
        </>
      )}
    </Stack>
  )
})

function resolveActiveBrand(
  pathname: string | null,
  brands: readonly BrandConfig[],
): BrandConfig | null {
  const match = pathname?.match(BRAND_PATH_REGEX)
  if (!match) {
    return null
  }
  return brands.find((b) => b.id === match[1]) ?? null
}
