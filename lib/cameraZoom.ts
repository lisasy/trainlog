export type ZoomInvert = {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
};

/**
 * Uniform scale so the year layer doesn't squash. Mini-month aspect ≠ the
 * month pane, and independent sx/sy reads as a stretch, not a camera move.
 */
export function invertToMatchUniform(
  pane: DOMRect,
  source: DOMRect,
  dest: DOMRect,
): ZoomInvert | null {
  if (dest.width === 0 || dest.height === 0) return null;
  const s = source.width / dest.width;
  const destX = dest.left - pane.left;
  const destY = dest.top - pane.top;
  const sourceX = source.left - pane.left;
  const sourceY = source.top - pane.top;
  return {
    sx: s,
    sy: s,
    tx: sourceX - destX * s,
    ty: sourceY - destY * s,
  };
}

/** Transform an element laid out at `from` so it visually matches `to`. Origin is the element's top-left. */
export function mapBox(from: DOMRect, to: DOMRect): ZoomInvert | null {
  if (from.width === 0 || from.height === 0) return null;
  return {
    sx: to.width / from.width,
    sy: to.height / from.height,
    tx: to.left - from.left,
    ty: to.top - from.top,
  };
}

/** FLIP invert: element is laid out at `last`; transform it so it looks like `first`. */
export function invertSelf(first: DOMRect, last: DOMRect): ZoomInvert | null {
  return mapBox(last, first);
}

export function invertCss(invert: ZoomInvert): string {
  return `translate(${invert.tx}px, ${invert.ty}px) scale(${invert.sx}, ${invert.sy})`;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const YEAR_ZOOM_MS = 480;
export const YEAR_ZOOM_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

export function zoomTransition(animate: boolean, extra = ""): string {
  if (!animate) return "none";
  const core = `transform ${YEAR_ZOOM_MS}ms ${YEAR_ZOOM_EASE}`;
  return extra ? `${core}, ${extra}` : core;
}
