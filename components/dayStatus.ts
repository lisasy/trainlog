/**
 * Day colors, resolved to static Tailwind class names.
 *
 * A marked day is colored by *when* it is, not by which split it was: warm for
 * training already done, cool for something scheduled ahead. Split type shows
 * as a text label instead.
 *
 * These are written out in full rather than interpolated — Tailwind scans
 * source text for complete class names, so a template string like
 * `text-${status}` produces no CSS at all.
 */

export function statusTextClass(isFuture: boolean): string {
  return isFuture ? "text-scheduled" : "text-logged";
}
