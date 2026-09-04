"use client";

import { PRESSABLE } from "@/lib/styles";

export type NavButtonProps = {
  label: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean;
  /** Accent-filled, matching the today cell in the grid. */
  emphasis?: boolean;
};

export default function NavButton({ label, onClick, ariaLabel, disabled, emphasis }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={[
        "tap-target inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3",
        PRESSABLE,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
        emphasis
          ? "bg-accent text-bg hover:bg-accent/85"
          : "bg-surface text-dim hover:bg-border hover:text-accent",
        "disabled:cursor-not-allowed disabled:bg-surface/40 disabled:text-dim/30 disabled:hover:bg-surface/40 disabled:hover:text-dim/30 disabled:active:scale-100 disabled:active:brightness-100",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
