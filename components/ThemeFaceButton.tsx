"use client";

import { FOCUS_RING, PRESSABLE } from "@/lib/styles";

export type ThemeFaceButtonProps = {
  onOpenTheme: () => void;
};

/** Shared `:) ` control — phone chrome on every view. */
export default function ThemeFaceButton({ onOpenTheme }: ThemeFaceButtonProps) {
  return (
    <button
      type="button"
      onClick={onOpenTheme}
      aria-label="Theme"
      className={[
        "tap-target inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#ef3232] text-sm font-semibold text-white",
        PRESSABLE,
        "hover:bg-[#ef3232]/85",
        FOCUS_RING,
      ].join(" ")}
    >
      :)
    </button>
  );
}
