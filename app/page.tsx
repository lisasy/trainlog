"use client";

import { useEffect, useState } from "react";
import Calendar from "@/components/Calendar";
import { addMonths, parseDateKey, startOfMonth, todayKey as getTodayKey } from "@/lib/dates";
import type { DateKey, TrainedDaysMap } from "@/lib/types";
import { loadTrainedDays, saveTrainedDays, toggleTrainedDay } from "@/lib/workouts";

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

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[26rem] flex-col px-4 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="mb-6 flex items-baseline gap-2">
        <span className="text-dim" aria-hidden>
          &gt;
        </span>
        <h1 className="text-[15px] tracking-[0.25em] text-accent glow">trainlog</h1>
        <span className="cursor-block ml-0.5 inline-block h-[0.9em] w-[0.5em] bg-accent" aria-hidden />
      </header>

      {mounted ? (
        <Calendar
          month={month}
          todayKey={todayKey}
          trainedDays={trainedDays}
          onPrevMonth={() => setMonth((m) => addMonths(m, -1))}
          onNextMonth={() => setMonth((m) => addMonths(m, 1))}
          onJumpToToday={() => setMonth(startOfMonth(parseDateKey(getTodayKey())))}
          onToggleDay={handleToggleDay}
        />
      ) : (
        <p className="text-[13px] text-dim">loading…</p>
      )}
    </main>
  );
}
