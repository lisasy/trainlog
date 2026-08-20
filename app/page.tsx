"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Calendar from "@/components/Calendar";
import DayDetailSheet from "@/components/DayDetailSheet";
import PREditSheet from "@/components/PREditSheet";
import PRList from "@/components/PRList";
import Sidebar from "@/components/Sidebar";
import StreakBadge from "@/components/StreakBadge";
import ThemePicker from "@/components/ThemePicker";
import {
  addMonths,
  isSameMonth,
  monthKey,
  monthListDescending,
  monthPath,
  parseDateKey,
  shiftDateKey,
  shiftMonthKeepDay,
  startOfMonth,
  todayKey as getTodayKey,
} from "@/lib/dates";
import {
  addPREntry,
  applySeed,
  datesWithPRs as computeDatesWithPRs,
  entriesForDate,
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
  const [pickerDate, setPickerDate] = useState<DateKey | null>(null);
  const [detailDate, setDetailDate] = useState<DateKey | null>(null);
  const [theme, setTheme] = useState<ThemeSelection>({ presetId: "zenwritten" });
  const [themeOpen, setThemeOpen] = useState(false);
  const [cursorDate, setCursorDate] = useState<DateKey | null>(null);
  const [view, setView] = useState<"calendar" | "prs">("calendar");
  /** Ledger drawer: an entry to edit, a name to prefill, or closed. */
  const [prSheet, setPRSheet] = useState<
    { mode: "add"; exerciseName?: string } | { mode: "edit"; id: string } | null
  >(null);

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
      if (pickerDate !== null || detailDate !== null || themeOpen) return;
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
          setPickerDate(anchor);
          return;
        default:
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
  }, [detailDate, pickerDate, themeOpen, todayKey]);

  const commitDays = useCallback((next: TrainedDaysMap) => {
    setTrainedDays(next);
    saveTrainedDays(next);
  }, []);

  const commitPRs = useCallback((next: PREntry[]) => {
    setPREntries(next);
    savePREntries(next);
  }, []);

  function handleMarkDay(date: DateKey, split: Split) {
    commitDays(markTrained(trainedDays, date, split));
    setPickerDate(null);
  }

  function handleClearDay(date: DateKey) {
    // Tombstone seeded days, or the seed would restore them next load.
    if (isSeedDate(date)) {
      saveRemovedSeedDates([...loadRemovedSeedDates(), date]);
    }
    commitDays(clearTrainedDay(trainedDays, date));
    setPickerDate(null);
  }

  function handleOpenDetail(date: DateKey) {
    setPickerDate(null);
    setDetailDate(date);
  }

  function commitTheme(next: ThemeSelection) {
    setTheme(next);
    applyTheme(resolveTheme(next));
    saveTheme(next);
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
  const datesWithPRs = useMemo(() => computeDatesWithPRs(prEntries), [prEntries]);
  const currentMonth = mounted ? startOfMonth(parseDateKey(todayKey)) : month;
  const months = useMemo(
    () => monthListDescending(currentMonth, 11, 1, month),
    [currentMonth, month],
  );
  const streakWeeks = useMemo(
    () => currentStreakWeeks(trainedDays, todayKey),
    [trainedDays, todayKey],
  );
  const monthCount = Object.keys(trainedDays).filter((key) => isSameMonth(key, month)).length;
  const totalTrained = Object.keys(trainedDays).length;

  return (
    <div className="flex min-h-dvh w-full">
      <Sidebar
        months={months}
        activeMonth={month}
        countsByMonth={countsByMonth}
        currentMonthKey={monthKey(currentMonth)}
        onSelectMonth={setMonth}
        onJumpToToday={jumpToToday}
        onOpenTheme={() => setThemeOpen(true)}
        view={view}
        onSelectView={setView}
      />

      <main className="flex min-h-dvh min-w-0 flex-1 flex-col px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        {/* h-11 + a dotted bottom border, identical to the sidebar's title bar,
            so the two chrome rules read as one line across the whole top. */}
        <header className="flex h-11 shrink-0 items-baseline justify-between gap-3 border-b border-dotted border-border pt-2">
          <span className="flex min-w-0 items-baseline">
            <span className="text-dim">&gt;&nbsp;</span>
            {/* The title lives in the sidebar once there is one; on phones the
                header carries it instead. */}
            <span className="text-accent glow lg:hidden">trainlog</span>
            <span className="hidden text-dim lg:inline">~/trainlog/</span>
            <span className="hidden text-accent glow lg:inline">{monthPath(month)}</span>
            <span
              className="cursor-block ml-1.5 inline-block h-[0.95em] w-[0.55em] translate-y-[0.1em] bg-accent"
              aria-hidden
            />
          </span>
          <span className="flex shrink-0 items-baseline gap-3 text-dim">
            {mounted ? <StreakBadge weeks={streakWeeks} /> : null}
            <span className="hidden sm:inline">{mounted ? `${monthCount} trained` : "…"}</span>
            <button
              type="button"
              onClick={() => setView(view === "calendar" ? "prs" : "calendar")}
              className="cursor-pointer transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none lg:hidden"
            >
              {view === "calendar" ? "prs" : "calendar"}
            </button>
            <button
              type="button"
              onClick={() => setThemeOpen(true)}
              className="cursor-pointer transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none lg:hidden"
            >
              theme
            </button>
          </span>
        </header>

        <div className="flex min-h-0 flex-1 flex-col py-3 sm:py-4">
          {mounted && view === "prs" ? (
            <PRList
              entries={prEntries}
              onAddPR={(exerciseName) => setPRSheet({ mode: "add", exerciseName })}
              onEditPR={(entry) => setPRSheet({ mode: "edit", id: entry.id })}
            />
          ) : mounted ? (
            <Calendar
              month={month}
              todayKey={todayKey}
              trainedDays={trainedDays}
              datesWithPRs={datesWithPRs}
              pickerDate={pickerDate}
              cursorDate={cursorDate}
              onPrevMonth={() => setMonth((m) => addMonths(m, -1))}
              onNextMonth={() => setMonth((m) => addMonths(m, 1))}
              onJumpToToday={jumpToToday}
              onOpenPicker={setPickerDate}
              onClosePicker={() => setPickerDate(null)}
              onMarkDay={handleMarkDay}
              onClearDay={handleClearDay}
              onOpenDetail={handleOpenDetail}
            />
          ) : (
            <p className="text-dim">loading…</p>
          )}
        </div>

        <div className="border-t border-dotted border-border">
          <div className="flex items-baseline justify-between py-1 text-dim">
            <span>{mounted ? `${totalTrained} days logged` : "…"}</span>
            <span className="hidden sm:inline lg:hidden">tap to mark · hold for details</span>
            <span className="hidden lg:inline">←→ month · ↑↓ week · h l day · enter to mark</span>
          </div>
        </div>
      </main>

      {prSheet !== null ? (
        <PREditSheet
          entry={prSheet.mode === "edit" ? prEntries.find((e) => e.id === prSheet.id) : undefined}
          initialExerciseName={prSheet.mode === "add" ? prSheet.exerciseName : undefined}
          allEntries={prEntries}
          todayKey={todayKey}
          onSubmit={(input) => {
            if (prSheet.mode === "edit") {
              commitPRs(updatePREntry(prEntries, prSheet.id, input));
              setPRSheet(null);
            } else {
              commitPRs(addPREntry(prEntries, input));
            }
          }}
          onDelete={
            prSheet.mode === "edit"
              ? () => {
                  handleRemovePR(prSheet.id);
                  setPRSheet(null);
                }
              : undefined
          }
          onClose={() => setPRSheet(null)}
        />
      ) : null}

      {themeOpen ? (
        <ThemePicker
          selection={theme}
          onSelectPreset={(presetId) => commitTheme({ ...theme, presetId })}
          onSetAccent={(accent) => commitTheme({ presetId: theme.presetId, ...(accent ? { accent } : {}) })}
          onImported={({ trainedDays: days, prEntries: prs }) => {
            const mergedDays = applyTrainedSeed(days, loadRemovedSeedDates());
            setTrainedDays(mergedDays);
            saveTrainedDays(mergedDays);
            // An imported backup is authoritative for this device; re-apply
            // the seed so any newer repo entries are still present.
            const merged = applySeed(prs, loadRemovedSeedIds());
            setPREntries(merged);
            savePREntries(merged);
          }}
          onClose={() => setThemeOpen(false)}
        />
      ) : null}

      {detailDate !== null ? (
        <DayDetailSheet
          date={detailDate}
          trainedDay={trainedDays[detailDate]}
          entries={entriesForDate(prEntries, detailDate)}
          allEntries={prEntries}
          onSelectSplit={(split) => commitDays(markTrained(trainedDays, detailDate, split))}
          onClearDay={() => handleClearDay(detailDate)}
          onAddPR={(input) =>
            commitPRs(addPREntry(prEntries, { ...input, date: detailDate }))
          }
          onRemovePR={handleRemovePR}
          onClose={() => setDetailDate(null)}
        />
      ) : null}
    </div>
  );
}
