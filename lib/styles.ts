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
