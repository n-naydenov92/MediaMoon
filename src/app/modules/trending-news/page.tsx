import { redirect } from 'next/navigation'

/**
 * Legacy route. Trending News is now brand-scoped under /brands/[brandId]/trending-news.
 */
export default function LegacyTrendingNewsPage(): never {
  redirect('/brands')
}
