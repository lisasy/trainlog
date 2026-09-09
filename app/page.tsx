"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "@/components/AppHeader";
import Calendar from "@/components/Calendar";
import MobileDock from "@/components/MobileDock";
import RightRail from "@/components/RightRail";
import PRList from "@/components/PRList";
import type { PRSheet } from "@/components/DayCardContent";
import type { PRFormInput } from "@/components/PRForm";
import Sidebar from "@/components/Sidebar";
import {
  isSameMonth,
  monthKey,
  isDateKeyInRange,
  monthListInRange,
  parseDateKey,
  shiftDateKey,
  shiftMonthKeepDay,
  startOfMonth,
  todayKey as getTodayKey,
  yearsInRange,
} from "@/lib/dates";
import { type View } from "@/lib/views";
import {
  addPREntry,
  applySeed,
  isSeedId,
  loadPREntries,
  loadRemovedSeedIds,
  removePREntry,
  savePREntries,
  saveRemovedSeedIds,
  updatePREntry,
} from "@/lib/prs";
import {
  applyTheme,
  loadTheme,
  resolveTheme,
  saveTheme,
  type ThemeSelection,
} from "@/lib/theme";
import type { DateKey, PREntry, Split, TrainedDaysMap } from "@/lib/types";
import {
  applyTrainedSeed,
  clearTrainedDay,
  countTrainedByMonth,
  currentStreakWeeks,
  isSeedDate,
  loadRemovedSeedDates,
  loadTrainedDays,
  markCompleted,
  saveRemovedSeedDates,
  saveTrainedDays,
  setSplit,
} from "@/lib/workouts";

export default function Home() {
  /**
   * Nothing renders until we've mounted. Both "today" and the stored log are
   * client-only facts — rendering them on the server would either mismatch on
   * hydration or flash the wrong month for anyone whose timezone differs from
   * the build machine's.
   */
  const [mounted, setMounted] = useState(false);
  const [trainedDays, setTrainedDays] = useState<TrainedDaysMap>({});
  const [prEntries, setPREntries] = useState<PREntry[]>([]);
  const [todayKey, setTodayKey] = useState<DateKey>("");
  const [month, setMonth] = useState<Date>(() => new Date());
  const [sheetDate, setSheetDate] = useState<DateKey | null>(null);
  const [theme, setTheme] = useState<ThemeSelection>({ presetId: "zenwritten" });
  const [themeOpen, setThemeOpen] = useState(false);
  const [cursorDate, setCursorDate] = useState<DateKey | null>(null);
  const [view, setView] = useState<View>("calendar");
  const [yearView, setYearView] = useState(false);
  const [yearFocus, setYearFocus] = useState(() => new Date().getFullYear());
  /** Ledger form: an entry to edit, a name to prefill, or closed. */
  const [prSheet, setPRSheet] = useState<PRSheet | null>(null);

  /**
   * Latest cursor/month, readable synchronously.
   *
   * The key handler can fire several times before React re-renders (key
   * repeat, or two fast presses). Reading state through the effect's closure
   * would make every event in that burst compute from the same stale value and
   * silently drop all but one, so each event advances these refs immediately.
   */
  const cursorRef = useRef<DateKey | null>(null);
  const monthRef = useRef<Date>(month);
  const viewRef = useRef(view);
  const yearViewRef = useRef(yearView);

  useEffect(() => {
    cursorRef.current = cursorDate;
  }, [cursorDate]);

  useEffect(() => {
    monthRef.current = month;
  }, [month]);

  useEffect(() => {
    viewRef.current = view;
    yearViewRef.current = false;
    setYearView(false);
    // Each form belongs to one view; leaving that view closes it.
    if (view !== "calendar") setSheetDate(null);
    if (view !== "prs") setPRSheet(null);
  }, [view]);

  useEffect(() => {
    yearViewRef.current = yearView;
  }, [yearView]);

  useEffect(() => {
    if (!yearView) setYearFocus(month.getFullYear());
  }, [month, yearView]);

  useEffect(() => {
    const today = getTodayKey();
    setTodayKey(today);
    setMonth(startOfMonth(parseDateKey(today)));
    setCursorDate(today);
    // Merge the repo's training history in, same additive rules as the PRs.
    const seededDays = applyTrainedSeed(loadTrainedDays(), loadRemovedSeedDates());
    setTrainedDays(seededDays);
    saveTrainedDays(seededDays);
    // Merge the repo's PR history in, so a fresh browser starts populated and
    // entries added to lib/seed.ts later show up on the next load.
    const seeded = applySeed(loadPREntries(), loadRemovedSeedIds());
    setPREntries(seeded);
    savePREntries(seeded);
    const storedTheme = loadTheme();
    setTheme(storedTheme);
    // The head script already applied this before paint; re-applying keeps
    // state and the DOM in step when there was nothing stored.
    applyTheme(resolveTheme(storedTheme));
    setMounted(true);
  }, []);

  /**
   * Keyboard navigation. Arrows move by month (left/right) and week (up/down);
   * h/l step a day within the week, j/k are the vim aliases for up/down.
   *
   * Suppressed while any dialog is open or while typing, so the day sheet's
   * inputs keep their own keys.
   */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (sheetDate !== null || themeOpen || prSheet !== null) return;
      if (viewRef.current !== "calendar") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (
        target !== null &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      if (yearViewRef.current) {
        if (event.key === "Escape") {
          event.preventDefault();
          setYearView(false);
          return;
        }
        if (event.key === "ArrowLeft" || event.key === "h") {
          event.preventDefault();
          setYearFocus((year) => {
            const years = yearsInRange(todayKey);
            const index = years.indexOf(year);
            return index > 0 ? years[index - 1] : year;
          });
          return;
        }
        if (event.key === "ArrowRight" || event.key === "l") {
          event.preventDefault();
          setYearFocus((year) => {
            const years = yearsInRange(todayKey);
            const index = years.indexOf(year);
            return index !== -1 && index < years.length - 1 ? years[index + 1] : year;
          });
          return;
        }
        return;
      }

      const anchor = cursorRef.current ?? todayKey;
      if (anchor === "") return;

      let nextDate: DateKey | null = null;
      switch (event.key) {
        case "ArrowLeft":
          nextDate = shiftMonthKeepDay(anchor, -1);
          break;
        case "ArrowRight":
          nextDate = shiftMonthKeepDay(anchor, 1);
          break;
        case "ArrowUp":
        case "k":
          nextDate = shiftDateKey(anchor, -7);
          break;
        case "ArrowDown":
        case "j":
          nextDate = shiftDateKey(anchor, 7);
          break;
        case "h":
          nextDate = shiftDateKey(anchor, -1);
          break;
        case "l":
          nextDate = shiftDateKey(anchor, 1);
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          setSheetDate(anchor);
          return;
        default:
          return;
      }

      // Outside March 2026 .. current month there is nothing to show, so the
      // move is simply refused rather than clamped to an edge date.
      if (!isDateKeyInRange(nextDate, todayKey)) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      cursorRef.current = nextDate;
      setCursorDate(nextDate);

      // Follow the cursor when it walks off the displayed month.
      if (!isSameMonth(nextDate, monthRef.current)) {
        const nextMonth = startOfMonth(parseDateKey(nextDate));
        monthRef.current = nextMonth;
        setMonth(nextMonth);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sheetDate, themeOpen, prSheet, todayKey]);

  const commitDays = useCallback((next: TrainedDaysMap) => {
    setTrainedDays(next);
    saveTrainedDays(next);
  }, []);

  const commitPRs = useCallback((next: PREntry[]) => {
    setPREntries(next);
    savePREntries(next);
  }, []);

  function handleClearDay(date: DateKey) {
    // Tombstone seeded days, or the seed would restore them next load.
    if (isSeedDate(date)) {
      saveRemovedSeedDates([...loadRemovedSeedDates(), date]);
    }
    commitDays(clearTrainedDay(trainedDays, date));
  }

  function commitTheme(next: ThemeSelection) {
    setTheme(next);
    applyTheme(resolveTheme(next));
    saveTheme(next);
  }

  function handleEditPR(entry: PREntry) {
    setPRSheet({ mode: "edit", id: entry.id });
  }

  function handleRemovePR(id: string) {
    // Tombstone seeded entries, or the seed would resurrect them next load.
    if (isSeedId(id)) {
      saveRemovedSeedIds([...loadRemovedSeedIds(), id]);
    }
    commitPRs(removePREntry(prEntries, id));
  }

  function jumpToToday() {
    const today = getTodayKey();
    const todayMonth = startOfMonth(parseDateKey(today));
    setMonth(todayMonth);
    setYearFocus(todayMonth.getFullYear());
    setYearView(false);
  }

  const countsByMonth = useMemo(() => countTrainedByMonth(trainedDays), [trainedDays]);
  const currentMonth = mounted ? startOfMonth(parseDateKey(todayKey)) : month;
  const months = useMemo(() => monthListInRange(todayKey), [todayKey]);
  const yearOptions = useMemo(() => yearsInRange(todayKey), [todayKey]);
  const yearIndex = yearOptions.indexOf(yearFocus);
  const canGoPrevYear = yearIndex > 0;
  const canGoNextYear = yearIndex !== -1 && yearIndex < yearOptions.length - 1;

  function stepYear(direction: 1 | -1) {
    const next = yearOptions[yearIndex + direction];
    if (next === undefined) return;
    setYearFocus(next);
  }

  function openYearView() {
    setSheetDate(null);
    setYearFocus(month.getFullYear());
    setYearView(true);
  }

  function toggleYearView() {
    if (yearView) setYearView(false);
    else openYearView();
  }

  function pickYearMonth(next: Date) {
    setMonth(next);
    setYearFocus(next.getFullYear());
    setView("calendar");
    setYearView(false);
  }

  // Desktop header's month nav: `months` is newest-first, so index 0 is the
  // current month and higher indices are further in the past.
  const activeMonthIndex = months.findIndex((candidate) => monthKey(candidate) === monthKey(month));
  const canGoPrevMonth = activeMonthIndex !== -1 && activeMonthIndex < months.length - 1;
  const canGoNextMonth = activeMonthIndex > 0;

  function goToMonth(next: Date) {
    setMonth(next);
    setYearFocus(next.getFullYear());
    setView("calendar");
    setYearView(false);
    setSheetDate((current) =>
      current !== null && isSameMonth(current, next) ? current : null,
    );
  }

  function stepMonth(direction: 1 | -1) {
    if (direction === 1 ? !canGoNextMonth : !canGoPrevMonth) return;
    const target = months[activeMonthIndex - direction];
    if (target !== undefined) goToMonth(target);
  }
  const streakWeeks = useMemo(
    () => currentStreakWeeks(trainedDays, todayKey),
    [trainedDays, todayKey],
  );

  // One card, two mounts (phone dock / desktop rail). Theme replaces the
  // current body; close restores because sheetDate / prSheet stay set.
  const currentCard = {
    streakWeeks,
    prEntries,
    trainedDays,
    todayKey,
    sheetDate: view === "calendar" ? sheetDate : null,
    onMarkCompleted: (date: DateKey) => commitDays(markCompleted(trainedDays, date)),
    onSelectSplit: (date: DateKey, split: Split) => {
      const current = trainedDays[date]?.split;
      commitDays(setSplit(trainedDays, date, current === split ? "" : split));
    },
    onClearDay: handleClearDay,
    onRemovePR: handleRemovePR,
    onCloseSheet: () => setSheetDate(null),
    prSheet: view === "prs" ? prSheet : null,
    onSubmitPR: (input: PRFormInput) => {
      if (prSheet?.mode === "edit") {
        commitPRs(updatePREntry(prEntries, prSheet.id, input));
        setPRSheet(null);
      } else {
        commitPRs(addPREntry(prEntries, input));
      }
    },
    onDeletePR: (id: string) => {
      handleRemovePR(id);
      setPRSheet(null);
    },
    onClosePR: () => setPRSheet(null),
    themeOpen,
    theme,
    onOpenTheme: () => setThemeOpen(true),
    onCloseTheme: () => setThemeOpen(false),
    onSelectPreset: (presetId: string) => commitTheme({ ...theme, presetId }),
    onSetAccent: (accent: string | undefined) =>
      commitTheme({ presetId: theme.presetId, ...(accent ? { accent } : {}) }),
    onImported: ({ trainedDays: days, prEntries: prs }: { trainedDays: TrainedDaysMap; prEntries: PREntry[] }) => {
      const mergedDays = applyTrainedSeed(days, loadRemovedSeedDates());
      setTrainedDays(mergedDays);
      saveTrainedDays(mergedDays);
      const merged = applySeed(prs, loadRemovedSeedIds());
      setPREntries(merged);
      savePREntries(merged);
    },
  };

  // Phone: while a calendar day sheet is open, the calendar column and the
  // dock trade flex-grow so the month collapses into a week strip and the
  // sheet grows into a stable working height. Desktop ignores this (`.sheet-
  // grow-*` is overridden ≥1024px) — the rail holds the form.
  const calendarActive = view === "calendar";
  const sheetOpen = calendarActive && sheetDate !== null;

  return (
    <div className="flex h-dvh w-full">
      <Sidebar onOpenTheme={() => setThemeOpen(true)} view={view} onSelectView={setView} />

      <main className="relative flex h-dvh min-w-0 flex-1 flex-col overflow-hidden px-4 pb-0 lg:pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AppHeader
          view={view}
          onOpenTheme={() => setThemeOpen(true)}
          months={months}
          activeMonth={month}
          countsByMonth={countsByMonth}
          currentMonthKey={monthKey(currentMonth)}
          onSelectMonth={goToMonth}
          onPrevMonth={() => stepMonth(-1)}
          onNextMonth={() => stepMonth(1)}
          canGoPrevMonth={canGoPrevMonth}
          canGoNextMonth={canGoNextMonth}
          onToday={() => {
            jumpToToday();
            setView("calendar");
          }}
          yearView={yearView}
          yearFocus={yearFocus}
          onToggleYearView={toggleYearView}
          onPrevYear={() => stepYear(-1)}
          onNextYear={() => stepYear(1)}
          canGoPrevYear={canGoPrevYear}
          canGoNextYear={canGoNextYear}
        />

        <div
          className={[
            "flex min-h-0 flex-col pt-3 pb-4 sm:pt-4",
            calendarActive ? "sheet-grow-cal" : "flex-1",
          ].join(" ")}
          style={calendarActive ? { flexGrow: sheetOpen ? 0 : 1 } : undefined}
        >
          {!mounted ? (
            <p className="text-dim">loading…</p>
          ) : view === "prs" ? (
            <PRList
              entries={prEntries}
              onAddPR={(exerciseName) => setPRSheet({ mode: "add", exerciseName })}
              onEditPR={handleEditPR}
            />
          ) : view === "splits" ? (
            <div className="flex flex-1 items-center justify-center text-dim">splits — not built yet</div>
          ) : view === "gallery" ? (
            <div className="flex flex-1 items-center justify-center text-dim">gallery — not built yet</div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <Calendar
                activeMonth={month}
                todayKey={todayKey}
                trainedDays={trainedDays}
                cursorDate={cursorDate}
                onTap={(date) =>
                  setSheetDate((current) => (current === date ? null : date))
                }
                sheetDate={sheetDate}
                yearView={yearView}
                yearFocus={yearFocus}
                onPickMonth={pickYearMonth}
                onStepYear={stepYear}
                canGoPrevYear={canGoPrevYear}
                canGoNextYear={canGoNextYear}
              />
            </div>
          )}
        </div>

        <MobileDock
          calendarView={calendarActive}
          sheetOpen={sheetOpen}
          view={view}
          onSelectView={setView}
          {...currentCard}
        />
      </main>

      <RightRail {...currentCard} />
    </div>
  );
}
