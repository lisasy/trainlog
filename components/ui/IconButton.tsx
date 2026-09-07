"use client";

import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { FOCUS_RING, PRESSABLE } from "@/lib/styles";

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: LucideIcon;
  /** Required — icon-only buttons have no visible text. */
  label: string;
  /** `sm` (36px, inline / in a row) · `md` (44px, standalone). */
  size?: "sm" | "md";
  /** `surface` = filled tile, `ghost` = bare glyph. */
  variant?: "surface" | "ghost";
};

const BOX = { sm: "h-9 w-9", md: "h-11 w-11" } as const;
const ICON_PX = { sm: 16, md: 20 } as const;

export default function IconButton({
  icon: Icon,
  label,
  size = "md",
  variant = "ghost",
  type = "button",
  className = "",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={[
        "tap-target inline-flex shrink-0 items-center justify-center rounded-lg",
        BOX[size],
        PRESSABLE,
        FOCUS_RING,
        variant === "surface"
          ? "bg-surface text-fg hover:bg-border hover:text-accent"
          : "text-dim hover:text-accent",
        className,
      ].join(" ")}
      {...rest}
    >
      <Icon size={ICON_PX[size]} aria-hidden />
    </button>
  );
}
