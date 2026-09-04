function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Eased rAF tween; snaps straight to `to` under prefers-reduced-motion. */
export function tween(
  from: number,
  to: number,
  durationMs: number,
  onUpdate: (value: number) => void,
  onDone?: () => void,
): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    onUpdate(to);
    onDone?.();
    return () => {};
  }

  let raf = 0;
  const start = performance.now();
  function step(now: number) {
    const t = Math.min(1, (now - start) / durationMs);
    onUpdate(from + (to - from) * easeOutCubic(t));
    if (t < 1) raf = requestAnimationFrame(step);
    else onDone?.();
  }
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
