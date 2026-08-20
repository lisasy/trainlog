"use client";

import { useEffect, useMemo, useState } from "react";
import Calendar from "@/components/Calendar";
import Rule from "@/components/Rule";
import Sidebar from "@/components/Sidebar";
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
import type { DateKey, TrainedDaysMap } from "@/lib/types";
import {
  countTrainedByMonth,
  loadTrainedDays,
  saveTrainedDays,
  toggleTrainedDay,
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
  const [todayKey, setTodayKey] = useState<DateKey>("");
  const [month, setMonth] = useState<Date>(() => new Date());

  useEffect(() => {
    const today = getTodayKey();
    setTodayKey(today);
    setMonth(startOfMonth(parseDateKey(today)));
    setTrainedDays(loadTrainedDays());
    setMounted(true);
  }, []);

  function handleToggleDay(date: DateKey) {
    const next = toggleTrainedDay(trainedDays, date);
    setTrainedDays(next);
    saveTrainedDays(next);
  }

  function jumpToToday() {
    setMonth(startOfMonth(parseDateKey(getTodayKey())));
  }

  const countsByMonth = useMemo(() => countTrainedByMonth(trainedDays), [trainedDays]);
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
      />

      <main className="flex min-h-dvh min-w-0 flex-1 flex-col px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <header className="flex h-11 shrink-0 items-baseline justify-between gap-3 pt-2">
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
          <span className="shrink-0 text-dim">{mounted ? `${monthCount} trained` : "…"}</span>
        </header>

        <Rule />

        <div className="flex min-h-0 flex-1 flex-col py-3 sm:py-4">
          {mounted ? (
            <Calendar
              month={month}
              todayKey={todayKey}
              trainedDays={trainedDays}
              onPrevMonth={() => setMonth((m) => addMonths(m, -1))}
              onNextMonth={() => setMonth((m) => addMonths(m, 1))}
              onJumpToToday={jumpToToday}
              onToggleDay={handleToggleDay}
            />
          ) : (
            <p className="text-dim">loading…</p>
          )}
        </div>

        <div>
          <Rule />
          <div className="flex items-baseline justify-between py-1 text-dim">
            <span>{mounted ? `${totalTrained} days logged` : "…"}</span>
            <span className="hidden sm:inline">tap a day to log it</span>
          </div>
        </div>
      </main>
    </div>
  );
}
