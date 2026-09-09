"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { FOCUS_RING, PRESSABLE } from "@/lib/styles";

export type ButtonVariant = "primary" | "quiet" | "ghost";
export type ButtonSize = "sm" | "md";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * `primary` — the one accent-filled action per screen.
   * `quiet` — a surface-filled secondary action (nav, chips, toolbar).
   * `ghost` — text-only, no fill until hover (cancel, dismiss).
   */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Selected state for chips / split tiles. Overrides `variant` color. */
  pressed?: boolean;
  children: ReactNode;
};

const BASE =
  "tap-target inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-center whitespace-nowrap " +
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 disabled:active:brightness-100";

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 min-w-9 px-3",
  md: "h-10 px-4",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-bg hover:bg-accent/85",
  quiet: "bg-surface text-dim hover:bg-border hover:text-accent",
  ghost: "border border-transparent text-dim hover:text-accent",
};

const PRESSED = "bg-fg/15 text-fg hover:bg-fg/20";

export default function Button({
  variant = "quiet",
  size = "md",
  pressed = false,
  type = "button",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        BASE,
        PRESSABLE,
        FOCUS_RING,
        SIZES[size],
        pressed ? PRESSED : VARIANTS[variant],
        className,
      ].join(" ")}
      {...rest}
      aria-pressed={pressed ? true : rest["aria-pressed"]}
    >
      {children}
    </button>
  );
}
