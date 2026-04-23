declare module 'google-trends-api' {
  interface TrendsOptions {
    keyword: string | string[]
    startTime?: Date
    endTime?: Date
    geo?: string
    hl?: string
  }
  const api: {
    interestOverTime: (options: TrendsOptions) => Promise<string>
    interestByRegion: (options: TrendsOptions) => Promise<string>
    relatedQueries: (options: TrendsOptions) => Promise<string>
    relatedTopics: (options: TrendsOptions) => Promise<string>
    dailyTrends: (options: TrendsOptions) => Promise<string>
    realTimeTrends: (options: TrendsOptions) => Promise<string>
  }
  export default api
}
