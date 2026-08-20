import { read, write } from "./storage";
import type { DateKey, PREntry } from "./types";

/**
 * prEntries CRUD.
 *
 * Flat and append-only by design. Entries are deliberately NOT deduped, and
 * a new entry is never checked against "is this actually heavier than last
 * time" — the source log this mirrors is not monotonic, and fighting that
 * would just make it wrong in a different way.
 */

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Non-secure contexts (plain http on a LAN address) have no randomUUID.
  return `pr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function loadPREntries(): PREntry[] {
  const entries = read<PREntry[]>("prEntries", []);
  return Array.isArray(entries) ? entries : [];
}

export function savePREntries(entries: PREntry[]): void {
  write("prEntries", entries);
}

export type NewPREntry = {
  exerciseName: string;
  weight: number;
  date: DateKey;
  note?: string;
};

export function addPREntry(entries: PREntry[], input: NewPREntry): PREntry[] {
  const note = input.note?.trim();
  const entry: PREntry = {
    id: newId(),
    exerciseName: input.exerciseName.trim(),
    weight: input.weight,
    date: input.date,
    ...(note ? { note } : {}),
  };
  return [...entries, entry];
}

export function removePREntry(entries: PREntry[], id: string): PREntry[] {
  return entries.filter((entry) => entry.id !== id);
}

export function entriesForDate(entries: PREntry[], date: DateKey): PREntry[] {
  return entries.filter((entry) => entry.date === date);
}

/** Dates that have at least one PR attached, for the calendar's marker. */
export function datesWithPRs(entries: PREntry[]): Set<DateKey> {
  return new Set(entries.map((entry) => entry.date));
}

/**
 * Distinct exercise names, most recently used first — the autocomplete source.
 * Matching is case-insensitive, but the casing the user typed is preserved.
 */
export function exerciseNames(entries: PREntry[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const name = entries[i].exerciseName;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

/** Autocomplete matches for what's been typed so far. */
export function suggestExercises(entries: PREntry[], query: string, limit = 5): string[] {
  const trimmed = query.trim().toLowerCase();
  const names = exerciseNames(entries);
  if (trimmed === "") return names.slice(0, limit);
  return names
    .filter((name) => {
      const lower = name.toLowerCase();
      return lower.includes(trimmed) && lower !== trimmed;
    })
    .slice(0, limit);
}
