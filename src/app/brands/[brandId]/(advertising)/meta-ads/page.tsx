import { redirect } from 'next/navigation'

interface Props {
  readonly params: Promise<{ readonly brandId: string }>
}

export default async function MetaAdsRedirect({ params }: Props): Promise<never> {
  const { brandId } = await params
  redirect(`/brands/${brandId}/meta-ads/overview`)
}
