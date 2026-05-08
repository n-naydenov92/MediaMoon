export const LABELS = {
  moduleName: 'Trending News',
  tabs: {
    overview: 'Overview',
  },
  markets: {
    BG: 'Bulgaria',
    ES: 'Spain',
    WORLD: 'Worldwide',
  } as const,
  newsBlock: {
    sources: 'sources',
    last: 'last',
    expand: 'Show articles',
    collapse: 'Hide articles',
  },
  highlightsSidebar: {
    title: 'Top Highlights',
    empty: 'No highlights yet.',
    separator: '·',
  },
  statsRow: {
    articles: 'Articles',
    clusters: 'Clusters',
    viral: 'Viral',
    hot: 'Hot',
  },
  topicPanel: {
    preparing: 'Preparing...',
  },
  keywordsPopover: {
    tooltip: 'Show search keywords',
    title: 'Searching for:',
  },
  sourceStatsPopover: {
    tooltip: 'Source stats',
    title: 'Articles per source',
  },
  overviewDashboard: {
    emptyLast24h: 'No stories in the last 24 hours',
  },
  topicDashboard: {
    emptyLast30d: 'No stories in the last 30 days',
  },
  emptyState: {
    retry: 'Try refreshing, or check back later.',
  },
  errorPanel: {
    noTabSelected: 'No tab selected',
    noTabMessage: 'Please choose a tab to continue.',
    unknownTab: 'Unknown tab',
    unsupportedTab: (tabId: string) => `Unsupported tab: ${tabId}`,
    loadError: "Couldn't load news",
  },
  sourceDebug: {
    label: (total: number) => `DEBUG — articles per source (pre-dedup, total raw: ${total})`,
    googleNewsRss: 'Google News RSS',
    searchApi: 'SearchAPI',
  },
  relativeTime: {
    justNow: 'just now',
    mAgo: 'm ago',
    hAgo: 'h ago',
    dAgo: 'd ago',
  },
  aria: {
    tabs: 'Trending News tabs',
    marketFilter: 'Market filter',
  },
} as const
