'use client'

import { useMemo } from 'react'
import type { Market } from '@/types'
import { findBrandById, type BrandId } from '@/config/brands'
import { getBusinessManagersForBrand } from '@/config/metaBusinessManagers'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import { ALL_MARKETS } from '@/lib/markets'
import AdAccountSummary from '../AdAccountSummary/AdAccountSummary'
import CampaignsList from '../CampaignsList/CampaignsList'
import Notice from '../Notice/Notice'
import { useMetaAdsData, type MarketBlock } from '../useMetaAdsData'
import styles from '../../page.module.css'

interface Props {
  readonly brandId: BrandId
}

const MARKET_LABELS: Record<Market, string> = {
  BG: 'Bulgaria',
  ES: 'Spain',
  WORLD: 'Worldwide',
}

export default function MetaAdsView({ brandId }: Props): JSX.Element | null {
  const brand = findBrandById(brandId)
  const { selectedMarket } = useBrandShellContext()

  const visibleMarkets = useMemo<readonly Market[]>(() => {
    if (!brand) {
      return []
    }
    if (selectedMarket === ALL_MARKETS) {
      return brand.markets
    }
    return [selectedMarket]
  }, [brand, selectedMarket])

  const expectedEnvVars = useMemo(
    () => (brand ? getBusinessManagersForBrand(brand.id).map((bm) => bm.tokenEnvVar) : []),
    [brand],
  )

  const state = useMetaAdsData(brand?.id ?? null, visibleMarkets)

  if (!brand) {
    return null
  }

  return (
    <section className={styles.root}>
      {state.status === 'loading' && (
        <Notice variant="info" title="Loading…">
          Fetching ad accounts and campaigns from Meta.
        </Notice>
      )}

      {state.status === 'no-token' && (
        <Notice variant="info" title="Pending Meta token approval">
          Connection to {brand.label}&apos;s Business Manager
          {expectedEnvVars.length > 1 ? 's' : ''} is not yet configured. Add{' '}
          <InlineList items={expectedEnvVars} separator=" or " renderItem={(v) => <code>{v}</code>} />{' '}
          to environment variables once the System User token is generated.
        </Notice>
      )}

      {state.status === 'error' && (
        <Notice variant="error" title="Failed to load Meta data">
          {state.message}
        </Notice>
      )}

      {state.status === 'success' && (
        <>
          {state.data.markets.map((block) => (
            <MarketSection
              key={block.market}
              block={block}
              brandColor={brand.color}
              showHeading={selectedMarket === ALL_MARKETS}
            />
          ))}

          {state.data.unmappedMarkets.length > 0 && (
            <Notice
              variant="info"
              title={`No ad account mapped for ${state.data.unmappedMarkets
                .map((m) => MARKET_LABELS[m])
                .join(', ')}`}
            >
              Add the <code>act_*</code> ID to <code>BRAND_MARKET_AD_ACCOUNTS</code> in{' '}
              <code>src/config/adAccounts.ts</code>.
            </Notice>
          )}
        </>
      )}
    </section>
  )
}

interface MarketSectionProps {
  readonly block: MarketBlock
  readonly brandColor: string
  readonly showHeading: boolean
}

function MarketSection({ block, brandColor, showHeading }: MarketSectionProps): JSX.Element {
  return (
    <div className={styles.marketBlock}>
      {showHeading && <h2 className={styles.marketHeading}>{MARKET_LABELS[block.market]}</h2>}
      {block.accounts.map(({ account, campaigns }) => (
        <div key={account.id} className={styles.marketBlock}>
          <AdAccountSummary account={account} brandColor={brandColor} />
          <CampaignsList campaigns={campaigns} />
        </div>
      ))}
      {block.missingAccountIds.length > 0 && (
        <Notice
          variant="error"
          title={`Account${block.missingAccountIds.length > 1 ? 's' : ''} not visible to configured token`}
        >
          <InlineList
            items={block.missingAccountIds}
            separator=", "
            renderItem={(id) => <code>{id}</code>}
          />{' '}
          — verify the System User has access in Business Settings.
        </Notice>
      )}
    </div>
  )
}

interface InlineListProps<T extends string> {
  readonly items: readonly T[]
  readonly separator: string
  readonly renderItem: (item: T) => JSX.Element
}

function InlineList<T extends string>({ items, separator, renderItem }: InlineListProps<T>): JSX.Element {
  return (
    <>
      {items.map((item, index) => (
        <span key={item}>
          {index > 0 ? separator : ''}
          {renderItem(item)}
        </span>
      ))}
    </>
  )
}
