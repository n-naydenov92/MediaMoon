// Canonical user-facing reason a library video can't be used for the chosen account.
// Shared by the client (library badge / added-row error) and the reupload API's
// defensive 422, so the wording stays identical everywhere.
export const CROSS_BM_VIDEO_REASON = 'This video is from a different Business Manager — it can’t be used '
  + 'with the selected account. Upload the video file directly, or pick an account in the same '
  + 'Business Manager.'

// Short badge label for a cross-BM video, shown on the library card and the added-row.
// Kept to a single word; the full reason lives in the tooltip.
export const CROSS_BM_BADGE = 'Unavailable'
