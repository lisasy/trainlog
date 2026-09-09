import type { ReactNode } from "react";

export type TipProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Hover label. Visibility is owned by `.tip` in globals.css — opacity 0 until
 * a `.group` ancestor is hovered, and only on `hover: hover` so a tap never
 * latches it open. Position with the extra className.
 */
export default function Tip({ children, className = "" }: TipProps) {
  return (
    <span
      aria-hidden
      className={[
        "tip pointer-events-none absolute z-20 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-sm text-fg",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
