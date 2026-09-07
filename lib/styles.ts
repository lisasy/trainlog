/**
 * Shared class strings — the low-level layer under `components/ui/`. A control
 * that can't use a `ui/` primitive (a one-off `<button>`, a custom tappable
 * div) still composes its affordance from these so the app stays consistent.
 */

/**
 * Press affordance shared by every clickable control in the app: a pointer
 * cursor, and a 0.98 scale-down plus a hair of dimming while held, springing
 * back to 1.0 on release. It darkens whatever the control is already
 * rendering (via `filter`) rather than a hardcoded color, so the same class
 * reads correctly on every surface — a bare surface tile, a filled chip, a
 * bordered pill — without per-component tuning.
 *
 * Pairs with the control's own `hover:` treatment; add one if it doesn't
 * have one yet. `transition-colors`/`transition-[...]` should not be added
 * alongside this — `transition-property` doesn't merge across classes, so a
 * second one silently drops this one's transform/filter transition.
 */
export const PRESSABLE =
  "cursor-pointer transition-[background-color,border-color,color,filter,transform] duration-100 active:scale-[0.98] active:brightness-90";

/**
 * The one focus-visible treatment for the whole app: a 2px inset accent ring,
 * no native outline. Every interactive element uses this exact ring — the
 * `ui/` primitives fold it in, one-off controls append it.
 */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent";

/**
 * Section label — the small upper-case caption over a group of controls
 * ("split", "prs", "presets", "recent wins"). One class, everywhere.
 */
export const SECTION_LABEL = "text-sm tracking-wide text-dim uppercase";
