/**
 * Application constants used for layout and API.
 * Centralized to avoid magic numbers and simplify tuning.
 */

/** Width in px of the fixed label column (swimlane names, header). */
export const LABEL_COL_WIDTH = 160;

/** Horizontal gap between overlapping event blocks in a lane (px). */
export const OVERLAP_GAP = 4;

/** Vertical gap between rows when events wrap in a lane (px). */
export const ROW_GAP = 8;

/** Padding inside a swimlane track (px). */
export const LANE_PADDING = 8;

/** Vertical stagger between overlapping blocks in the same row (px). */
export const VERTICAL_STAGGER = 12;

/** Event block color classes (cycle by hash of event id). */
export const EVENT_BLOCK_COLORS = [
  "color-violet",
  "color-teal",
  "color-coral",
  "color-amber",
  "color-accent",
];

/** Default lane height from CSS (fallback if getComputedStyle unavailable). */
export const DEFAULT_LANE_HEIGHT_PX = 80;
