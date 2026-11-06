// The ONE place that decides which events the Events page features. The page shows exactly these events, in this order.
// Each id must match an event.json under src/content/organizations/** (tools/validate_content.py checks this).
export const FEATURED_EVENT_IDS = [
  'valorant-summit-5v5',
  'code-relay-2026',
  'datastream-jacked-into-the-grid',
  'rgc-review-group-conference',
] as const;
