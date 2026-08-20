"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Calendar from "@/components/Calendar";
import DayDetailSheet from "@/components/DayDetailSheet";
import Sidebar from "@/components/Sidebar";
import ThemePicker from "@/components/ThemePicker";
import {
  addMonths,
  isSameMonth,
  monthKey,
  monthListDescending,
  monthPath,
  parseDateKey,
  startOfMonth,
  todayKey as getTodayKey,
} from "@/lib/dates";
import {
  addPREntry,
  datesWithPRs as computeDatesWithPRs,
  entriesForDate,
  loadPREntries,
  removePREntry,
  savePREntries,
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
  clearTrainedDay,
  countTrainedByMonth,
  loadTrainedDays,
  markTrained,
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

  useEffect(() => {
    const today = getTodayKey();
    setTodayKey(today);
    setMonth(startOfMonth(parseDateKey(today)));
    setTrainedDays(loadTrainedDays());
    setPREntries(loadPREntries());
    const storedTheme = loadTheme();
    setTheme(storedTheme);
    // The head script already applied this before paint; re-applying keeps
    // state and the DOM in step when there was nothing stored.
    applyTheme(resolveTheme(storedTheme));
    setMounted(true);
  }, []);

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
            <span>{mounted ? `${monthCount} trained` : "…"}</span>
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
          {mounted ? (
            <Calendar
              month={month}
              todayKey={todayKey}
              trainedDays={trainedDays}
              datesWithPRs={datesWithPRs}
              pickerDate={pickerDate}
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
            <span className="hidden sm:inline">tap to mark · hold for details</span>
          </div>
        </div>
      </main>

      {themeOpen ? (
        <ThemePicker
          selection={theme}
          onSelectPreset={(presetId) => commitTheme({ ...theme, presetId })}
          onSetAccent={(accent) => commitTheme({ presetId: theme.presetId, ...(accent ? { accent } : {}) })}
          onImported={({ trainedDays: days, prEntries: prs }) => {
            setTrainedDays(days);
            setPREntries(prs);
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
          onClearDay={() => commitDays(clearTrainedDay(trainedDays, detailDate))}
          onAddPR={(input) =>
            commitPRs(addPREntry(prEntries, { ...input, date: detailDate }))
          }
          onRemovePR={(id) => commitPRs(removePREntry(prEntries, id))}
          onClose={() => setDetailDate(null)}
        />
      ) : null}
    </div>
  );
}
