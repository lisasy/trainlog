import { isSeedId, seedEntries } from "./seed";
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

export type PREntryPatch = {
  exerciseName: string;
  weight: number;
  date: DateKey;
  note?: string;
};

/** Edits an entry in place, keeping its id so seed identity survives. */
export function updatePREntry(entries: PREntry[], id: string, patch: PREntryPatch): PREntry[] {
  const note = patch.note?.trim();
  return entries.map((entry) =>
    entry.id === id
      ? {
          id: entry.id,
          exerciseName: patch.exerciseName.trim(),
          weight: patch.weight,
          date: patch.date,
          ...(note ? { note } : {}),
        }
      : entry,
  );
}

export function removePREntry(entries: PREntry[], id: string): PREntry[] {
  return entries.filter((entry) => entry.id !== id);
}

export function entriesForDate(entries: PREntry[], date: DateKey): PREntry[] {
  return entries.filter((entry) => entry.date === date);
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

export type ExerciseGroup = {
  exerciseName: string;
  /** Newest first. */
  entries: PREntry[];
  /**
   * The most recent entry by date — not the heaviest. The source log isn't
   * strictly increasing, so recomputing a "true max" would show a number the
   * user doesn't consider current.
   */
  current: PREntry;
};

/**
 * Groups entries by exercise for the ledger. Names are matched
 * case-insensitively, and the casing of the most recent entry wins.
 */
export function groupByExercise(entries: PREntry[]): ExerciseGroup[] {
  const byName = new Map<string, PREntry[]>();
  for (const entry of entries) {
    const key = entry.exerciseName.trim().toLowerCase();
    const list = byName.get(key);
    if (list === undefined) byName.set(key, [entry]);
    else list.push(entry);
  }

  const groups: ExerciseGroup[] = [];
  for (const list of byName.values()) {
    // Reverse first so that among entries sharing a date, the one added last
    // sorts as the newer — Array.sort is stable, so it would otherwise keep
    // insertion order and call the oldest one current.
    const sorted = [...list].reverse().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    groups.push({ exerciseName: sorted[0].exerciseName, entries: sorted, current: sorted[0] });
  }

  groups.sort((a, b) => {
    if (a.current.date !== b.current.date) return a.current.date < b.current.date ? 1 : -1;
    return a.exerciseName.localeCompare(b.exerciseName);
  });
  return groups;
}

/**
 * Ids of seed entries the user has deleted.
 *
 * Without these, deleting a seeded PR would be undone the moment the seed ran
 * again on the next load.
 */
export function loadRemovedSeedIds(): string[] {
  const ids = read<string[]>("prSeedRemoved", []);
  return Array.isArray(ids) ? ids : [];
}

export function saveRemovedSeedIds(ids: string[]): void {
  write("prSeedRemoved", ids);
}

/**
 * Adds any seed entry that isn't already present and hasn't been deleted.
 *
 * Ids are content-derived, so this is idempotent across reloads and picks up
 * entries added to the seed file later without touching anything the user
 * created in the app.
 *
 * Seed rows whose ids are no longer in the file (usually from a mid-list
 * insert that shifted the index suffix) are dropped so they don't duplicate.
 */
export function applySeed(entries: PREntry[], removedIds: readonly string[]): PREntry[] {
  const canonical = seedEntries();
  const canonicalIds = new Set(canonical.map((entry) => entry.id));
  const removed = new Set(removedIds);
  const kept = entries.filter((entry) => !isSeedId(entry.id) || canonicalIds.has(entry.id));
  const present = new Set(kept.map((entry) => entry.id));
  const missing = canonical.filter(
    (entry) => !present.has(entry.id) && !removed.has(entry.id),
  );
  if (missing.length === 0 && kept.length === entries.length) return entries;
  return [...kept, ...missing];
}

export { isSeedId };
