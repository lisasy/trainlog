"use client";

import { monthKey, monthNameYear } from "@/lib/dates";

export type SidebarProps = {
  /** Newest first. */
  months: Date[];
  /** The month currently shown in the body. */
  activeMonth: Date;
  /** Trained-day totals keyed by "YYYY-MM". */
  countsByMonth: Record<string, number>;
  currentMonthKey: string;
  onSelectMonth: (month: Date) => void;
  onJumpToToday: () => void;
};

export default function Sidebar({
  months,
  activeMonth,
  countsByMonth,
  currentMonthKey,
  onSelectMonth,
  onJumpToToday,
}: SidebarProps) {
  const activeKey = monthKey(activeMonth);

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-dotted border-border pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm lg:flex">
      {/* h-11 matches the body header exactly, so this bottom border and the
          body's land on the same line. */}
      <div className="flex h-11 shrink-0 items-baseline border-b border-dotted border-border px-3 pt-2">
        <span className="text-dim">&gt;&nbsp;</span>
        <span className="text-accent glow">trainlog</span>
        <span
          className="cursor-block ml-1.5 inline-block h-[0.95em] w-[0.55em] translate-y-[0.1em] bg-accent"
          aria-hidden
        />
      </div>

      <nav aria-label="Months" className="min-h-0 flex-1 overflow-y-auto px-1 pt-2 pb-2">
        <div className="flex items-baseline justify-between px-2 pb-1">
          <span className="text-dim">months</span>
          <button
            type="button"
            onClick={onJumpToToday}
            className="cursor-pointer text-dim transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
          >
            today
          </button>
        </div>

        {months.map((month) => {
          const key = monthKey(month);
          const count = countsByMonth[key] ?? 0;
          const isActive = key === activeKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectMonth(month)}
              aria-current={isActive ? "true" : undefined}
              className={[
                "flex w-full cursor-pointer items-baseline gap-2 px-2 py-0.5 text-left transition-colors",
                "focus-visible:outline-none",
                isActive ? "bg-fg/10 text-fg" : "text-fg/60 hover:bg-fg/5",
              ].join(" ")}
            >
              {/* Lit when the month has training logged, dark when it doesn't. */}
              <span className={count > 0 ? "text-accent" : "text-dim/40"} aria-hidden>
                ●
              </span>
              <span className="min-w-0 flex-1 truncate">
                {monthNameYear(month)}
                {key === currentMonthKey ? <span className="text-dim">&nbsp;·</span> : null}
              </span>
              <span className="text-dim">{count > 0 ? count : "~"}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex items-baseline justify-between border-t border-dotted border-border px-3 py-1 text-dim">
        <span>local</span>
        <span>v0.1</span>
      </div>
    </aside>
  );
}
