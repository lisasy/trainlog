"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NavButton from "@/components/NavButton";
import Calendar from "@/components/Calendar";
import MobileDock from "@/components/MobileDock";
import RightRail from "@/components/RightRail";
import MonthDropdown from "@/components/MonthDropdown";
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
} from "@/lib/dates";
import { VIEW_SIDEBAR_LABELS, type View } from "@/lib/views";
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
  markTrained,
  saveRemovedSeedDates,
  saveTrainedDays,
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

  useEffect(() => {
    cursorRef.current = cursorDate;
  }, [cursorDate]);

  useEffect(() => {
    monthRef.current = month;
  }, [month]);

  useEffect(() => {
    viewRef.current = view;
    // Each form belongs to one view; leaving that view closes it.
    if (view !== "calendar") setSheetDate(null);
    if (view !== "prs") setPRSheet(null);
  }, [view]);

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
    setMonth(startOfMonth(parseDateKey(getTodayKey())));
  }

  const countsByMonth = useMemo(() => countTrainedByMonth(trainedDays), [trainedDays]);
  const currentMonth = mounted ? startOfMonth(parseDateKey(todayKey)) : month;
  const months = useMemo(() => monthListInRange(todayKey), [todayKey]);

  // Desktop header's month nav: `months` is newest-first, so index 0 is the
  // current month and higher indices are further in the past.
  const activeMonthIndex = months.findIndex((candidate) => monthKey(candidate) === monthKey(month));
  const canGoPrevMonth = activeMonthIndex !== -1 && activeMonthIndex < months.length - 1;
  const canGoNextMonth = activeMonthIndex > 0;

  function goToMonth(next: Date) {
    setMonth(next);
    setView("calendar");
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
  const monthCount = Object.keys(trainedDays).filter((key) => isSameMonth(key, month)).length;

  // One card, two mounts (phone dock / desktop rail). Theme replaces the
  // current body; close restores because sheetDate / prSheet stay set.
  const currentCard = {
    streakWeeks,
    prEntries,
    trainedDays,
    todayKey,
    sheetDate: view === "calendar" ? sheetDate : null,
    onSelectSplit: (date: DateKey, split: Split) =>
      commitDays(markTrained(trainedDays, date, split)),
    onClearDay: handleClearDay,
    onAddPR: (date: DateKey, input: { exerciseName: string; weight: number; note?: string }) =>
      commitPRs(addPREntry(prEntries, { ...input, date })),
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

  return (
    <div className="flex h-dvh w-full">
      <Sidebar onOpenTheme={() => setThemeOpen(true)} view={view} onSelectView={setView} />

      <main className="relative flex h-dvh min-w-0 flex-1 flex-col overflow-hidden px-4 pt-[env(safe-area-inset-top)] pb-0 lg:pt-0 lg:pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* Desktop only — phones navigate from the bottom nav and the month
            row above the calendar, so this whole bar is gratuitous there. */}
        <header className="hidden h-11 shrink-0 items-center justify-between gap-3 pt-2 lg:flex">
          {view === "calendar" ? (
            <>
              <span className="flex items-center gap-2">
                <span className="text-dim">:</span>
                <NavButton
                  label={<ChevronLeft size={16} />}
                  onClick={() => stepMonth(-1)}
                  ariaLabel="Previous month"
                  disabled={!canGoPrevMonth}
                />
                <MonthDropdown
                  months={months}
                  activeMonth={month}
                  countsByMonth={countsByMonth}
                  currentMonthKey={monthKey(currentMonth)}
                  onSelectMonth={goToMonth}
                />
                <NavButton
                  label={<ChevronRight size={16} />}
                  onClick={() => stepMonth(1)}
                  ariaLabel="Next month"
                  disabled={!canGoNextMonth}
                />
                <NavButton
                  label="today"
                  onClick={() => {
                    jumpToToday();
                    setView("calendar");
                  }}
                  ariaLabel="Jump to current month"
                />
              </span>
              <span className="shrink-0 text-dim">{mounted ? `${monthCount} trained` : "…"}</span>
            </>
          ) : (
            <span className="text-accent">{VIEW_SIDEBAR_LABELS[view]}</span>
          )}
        </header>

        <div className="flex min-h-0 flex-1 flex-col pt-3 pb-4 sm:pt-4">
          {!mounted ? (
            <p className="text-dim">loading…</p>
          ) : view === "prs" ? (
            <PRList
              entries={prEntries}
              onAddPR={(exerciseName) => setPRSheet({ mode: "add", exerciseName })}
              onEditPR={handleEditPR}
              onOpenTheme={() => setThemeOpen(true)}
            />
          ) : view === "splits" ? (
            <div className="flex flex-1 items-center justify-center text-dim">splits — not built yet</div>
          ) : view === "gallery" ? (
            <div className="flex flex-1 items-center justify-center text-dim">gallery — not built yet</div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <Calendar
                months={months}
                activeMonth={month}
                todayKey={todayKey}
                trainedDays={trainedDays}
                cursorDate={cursorDate}
                onActiveMonthChange={(next) => {
                  setMonth(next);
                  setSheetDate((current) =>
                    current !== null && isSameMonth(current, next) ? current : null,
                  );
                }}
                onTap={(date) =>
                  setSheetDate((current) => (current === date ? null : date))
                }
                countsByMonth={countsByMonth}
                currentMonthKey={monthKey(currentMonth)}
                onOpenTheme={() => setThemeOpen(true)}
                sheetDate={sheetDate}
              />
            </div>
          )}
        </div>

        <MobileDock
          calendarView={view === "calendar"}
          view={view}
          onSelectView={setView}
          {...currentCard}
        />
      </main>

      <RightRail {...currentCard} />
    </div>
  );
}
