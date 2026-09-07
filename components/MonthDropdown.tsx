"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Dot } from "lucide-react";
import { monthFullName, monthKey, monthNameYear, monthPath } from "@/lib/dates";
import { PRESSABLE } from "@/lib/styles";

export type MonthDropdownProps = {
  /** Newest first. */
  months: Date[];
  activeMonth: Date;
  countsByMonth: Record<string, number>;
  currentMonthKey: string;
  onSelectMonth: (month: Date) => void;
  /** `title` is the phone calendar's large month name. */
  variant?: "path" | "title";
};

export default function MonthDropdown({
  months,
  activeMonth,
  countsByMonth,
  currentMonthKey,
  onSelectMonth,
  variant = "path",
}: MonthDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeKey = monthKey(activeMonth);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          variant === "title"
            ? [
                "inline-flex items-center gap-1 text-2xl leading-none text-fg",
                PRESSABLE,
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
              ].join(" ")
            : "cursor-pointer text-accent glow transition-colors focus-visible:outline-none"
        }
      >
        {variant === "title" ? monthFullName(activeMonth) : monthPath(activeMonth)}
        <span className="inline-flex text-dim" aria-hidden>
          {variant === "title" ? (
            open ? <ChevronDown size={18} /> : <ChevronRight size={18} />
          ) : open ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Months"
          className="absolute top-full left-0 z-30 mt-2 max-h-80 w-48 overflow-y-auto border border-border bg-bg py-1 text-sm shadow-lg"
        >
          {months.map((month) => {
            const key = monthKey(month);
            const count = countsByMonth[key] ?? 0;
            const isActive = key === activeKey;

            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onSelectMonth(month);
                  setOpen(false);
                }}
                className={[
                  "flex w-full cursor-pointer items-baseline gap-2 px-3 py-1 text-left transition-colors",
                  isActive ? "bg-fg/10 text-fg" : "text-fg/90 hover:bg-fg/5",
                ].join(" ")}
              >
                <span className={count > 0 ? "text-accent" : "text-dim/40"} aria-hidden>
                  <Dot size={16} />
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {monthNameYear(month)}
                  {key === currentMonthKey ? <span className="text-dim">&nbsp;·</span> : null}
                </span>
                <span className="text-dim">{count > 0 ? count : "~"}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
