# trainlog

## Interaction affordance (always)

Every clickable control must show it's clickable, on every input path:

- **Hover**: `cursor-pointer` plus a visible change — a background fill, a text/border
  color shift, or both. Never ship a `<button>` with no hover treatment at all.
- **Press**: apply `PRESSABLE` from `lib/styles.ts` (0.98 scale-down + a hair of
  darkening via `filter: brightness()`, springing back to 1.0 on release). It darkens
  whatever the control already renders, so it works unmodified on any surface — no
  per-component color math needed. See `DayCell.tsx`, `NavButton.tsx`, `BottomNav.tsx`
  for reference usage.

Don't hand-roll a new press effect — reuse `PRESSABLE`. If a control's `className`
already sets `transition-colors` or another `transition-[...]`, fold that into
`PRESSABLE`'s own `transition-[...]` list rather than adding a second transition
utility — `transition-property` doesn't merge across classes, so a second one silently
drops the first one's transitions.

When adding any new interactive element (button, link styled as a control, custom
tappable div), give it this treatment before considering the work done — don't wait to
be asked per-component.
