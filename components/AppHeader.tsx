"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_TITLE } from "@/lib/styles";
import { VIEW_PAGE_TITLES, type View } from "@/lib/views";
import MonthDropdown from "./MonthDropdown";
import NavButton from "./NavButton";
import ThemeFaceButton from "./ThemeFaceButton";
import Button from "./ui/Button";

export type AppHeaderProps = {
  view: View;
  onOpenTheme: () => void;
  months: Date[];
  activeMonth: Date;
  countsByMonth: Record<string, number>;
  currentMonthKey: string;
  onSelectMonth: (month: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoPrevMonth: boolean;
  canGoNextMonth: boolean;
  onToday: () => void;
  yearView: boolean;
  yearFocus: number;
  onToggleYearView: () => void;
  onPrevYear: () => void;
  onNextYear: () => void;
  canGoPrevYear: boolean;
  canGoNextYear: boolean;
};

/**
 * Global top chrome. Phone: utility row (`year` / `:)`) then the page title.
 * Desktop: the same title row, aligned with the sidebar brand.
 */
export default function AppHeader({
  view,
  onOpenTheme,
  months,
  activeMonth,
  countsByMonth,
  currentMonthKey,
  onSelectMonth,
  onPrevMonth,
  onNextMonth,
  canGoPrevMonth,
  canGoNextMonth,
  onToday,
  yearView,
  yearFocus,
  onToggleYearView,
  onPrevYear,
  onNextYear,
  canGoPrevYear,
  canGoNextYear,
}: AppHeaderProps) {
  const yearChip =
    view === "calendar" ? (
      <Button
        variant="quiet"
        size="sm"
        pressed={yearView}
        onClick={onToggleYearView}
        aria-label={yearView ? "Show month calendar" : "Show year calendar"}
      >
        {yearFocus}
      </Button>
    ) : null;

  const title =
    view !== "calendar" ? (
      <h1 className={PAGE_TITLE}>{VIEW_PAGE_TITLES[view]}</h1>
    ) : yearView ? null : (
      <MonthDropdown
        variant="title"
        months={months}
        activeMonth={activeMonth}
        countsByMonth={countsByMonth}
        currentMonthKey={currentMonthKey}
        onSelectMonth={onSelectMonth}
      />
    );

  const canGoPrev = yearView ? canGoPrevYear : canGoPrevMonth;
  const canGoNext = yearView ? canGoNextYear : canGoNextMonth;
  const onPrev = yearView ? onPrevYear : onPrevMonth;
  const onNext = yearView ? onNextYear : onNextMonth;

  return (
    <header className="shrink-0 pt-[env(safe-area-inset-top)] lg:pt-2">
      <div className="flex h-9 items-center justify-between lg:hidden">
        {yearChip ?? <span />}
        <ThemeFaceButton onOpenTheme={onOpenTheme} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 lg:mt-0 lg:min-h-11">
        <div className="flex min-w-0 items-center gap-2">
          {yearChip ? <span className="hidden lg:inline-flex">{yearChip}</span> : null}
          {title}
          {view === "calendar" ? (
            <span className="hidden lg:inline-flex items-center gap-1">
              <NavButton
                label={<ChevronLeft size={16} />}
                onClick={onPrev}
                ariaLabel={yearView ? "Previous year" : "Previous month"}
                disabled={!canGoPrev}
              />
              <NavButton
                label={<ChevronRight size={16} />}
                onClick={onNext}
                ariaLabel={yearView ? "Next year" : "Next month"}
                disabled={!canGoNext}
              />
            </span>
          ) : null}
        </div>

        {view === "calendar" ? (
          <>
            <Button
              variant="quiet"
              size="sm"
              onClick={onToday}
              aria-label="Jump to current month"
              className="lg:hidden uppercase"
            >
              today
            </Button>
            <span className="hidden lg:inline-flex">
              <NavButton label="today" onClick={onToday} ariaLabel="Jump to current month" />
            </span>
          </>
        ) : null}
      </div>
    </header>
  );
}
