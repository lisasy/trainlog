"use client";

import { useEffect } from "react";
import { SPLITS, type Split } from "@/lib/types";

export type SplitPickerProps = {
  /** "add workout" / "schedule workout" / "edit workout". */
  heading: string;
  isTrained: boolean;
  currentSplit?: string;
  /** Open upward when the cell is near the bottom of the grid. */
  flipUp: boolean;
  /** Right-align when the cell is in one of the last columns. */
  alignRight: boolean;
  onSelect: (split: Split) => void;
  onClear: () => void;
  onOpenDetail: () => void;
  onClose: () => void;
};

/**
 * The two-tap marking flow: tap a day, pick a split.
 *
 * A bottom sheet on phones and a popover anchored to the cell from `sm` up —
 * same markup, switched entirely by responsive positioning classes.
 */
export default function SplitPicker({
  heading,
  isTrained,
  currentSplit,
  flipUp,
  alignRight,
  onSelect,
  onClear,
  onOpenDetail,
  onClose,
}: SplitPickerProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Catches the click that dismisses the picker. */}
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-label="Choose split"
        className={[
          "fixed inset-x-2 bottom-2 z-50 border border-border bg-bg text-sm",
          "sm:absolute sm:inset-x-auto sm:w-40",
          flipUp ? "sm:bottom-full sm:mb-1" : "sm:top-full sm:bottom-auto sm:mt-1",
          alignRight ? "sm:right-0" : "sm:left-0",
        ].join(" ")}
      >
        <div className="border-b border-dotted border-border px-2 py-1 text-dim">{heading}</div>

        {SPLITS.map((split) => {
          const isCurrent = split === currentSplit;
          return (
            <button
              key={split}
              type="button"
              onClick={() => onSelect(split)}
              aria-pressed={isCurrent}
              className="flex w-full cursor-pointer items-baseline gap-2 px-2 py-2 text-left hover:bg-fg/10 focus-visible:bg-fg/10 focus-visible:outline-none sm:py-1"
            >
              <span className={isCurrent ? "text-accent" : "text-dim/40"} aria-hidden>
                ▪
              </span>
              <span className={isCurrent ? "text-fg" : "text-fg/70"}>{split}</span>
            </button>
          );
        })}

        <div className="flex items-center justify-between border-t border-dotted border-border">
          <button
            type="button"
            onClick={onOpenDetail}
            className="cursor-pointer px-2 py-2 text-dim hover:text-accent focus-visible:text-accent focus-visible:outline-none sm:py-1"
          >
            details
          </button>
          {isTrained ? (
            <button
              type="button"
              onClick={onClear}
              className="cursor-pointer px-2 py-2 text-dim hover:text-accent focus-visible:text-accent focus-visible:outline-none sm:py-1"
            >
              clear
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
