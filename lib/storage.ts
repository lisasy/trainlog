/**
 * The only module in the app that touches localStorage.
 *
 * Everything else goes through `lib/workouts.ts` / `lib/prs.ts`, which go
 * through here. To move to a real DB later, reimplement these four functions
 * (async, if needed) and nothing in /components has to change.
 */

const PREFIX = "trainlog:";

/** Every key we persist. Adding one here is the only place it's declared. */
export type StorageKey = "trainedDays" | "prEntries" | "theme";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Read and parse a key. Returns `fallback` when absent, when running on the
 * server, or when the stored value is corrupt — a bad blob should degrade to
 * an empty log, never crash the app on load.
 */
export function read<T>(key: StorageKey, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Serialize and persist a key. Swallows quota / private-mode failures: the
 * in-memory React state is still correct, so the session keeps working even
 * when the write can't land.
 */
export function write<T>(key: StorageKey, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Intentionally ignored — see above.
  }
}

export function remove(key: StorageKey): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // Intentionally ignored.
  }
}
