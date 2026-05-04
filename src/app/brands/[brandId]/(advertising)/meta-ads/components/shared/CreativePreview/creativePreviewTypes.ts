export interface CreativePreviewData {
  readonly adId: string
  readonly adName: string
  readonly pageName: string | null
  readonly pageAvatarUrl: string | null
  readonly body: string | null
  readonly headline: string | null
  readonly description: string | null
  readonly callToAction: string | null
  readonly imageUrl: string | null
  readonly videoUrl: string | null
  readonly videoThumbnail: string | null
}

export type CreativePreviewState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'no-content'; readonly data: CreativePreviewData }
  | { readonly status: 'success'; readonly data: CreativePreviewData }
