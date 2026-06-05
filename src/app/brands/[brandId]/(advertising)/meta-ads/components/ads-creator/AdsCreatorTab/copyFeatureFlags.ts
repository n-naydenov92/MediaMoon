// Multi-text variations ([1..4]) are authored in the UI but Meta only receives the
// first text today (see buildPublishPayload, which sends primaryTexts[0]/headlines[0]).
// Until the gateway publishes the full set via asset_feed_spec, copy is single-value
// per field. Flip this flag to re-enable the variation-authoring UI in one place.
export const COPY_VARIATIONS_ENABLED = false

// The cap handed to every VariationList. With variations off this collapses each
// field to a single input (no "Add variation" affordance, no extra rows).
export const MAX_COPY_VARIATIONS = COPY_VARIATIONS_ENABLED ? 5 : 1
