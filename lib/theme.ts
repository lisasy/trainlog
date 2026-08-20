import { read, write } from "./storage";

/**
 * The theme system.
 *
 * Every color in the app resolves to one of these variables, so switching a
 * theme is only ever a matter of setting them on :root — no component knows
 * which theme is active.
 */

export type ThemeVars = {
  bg: string;
  fg: string;
  accent: string;
  dim: string;
  border: string;
  logged: string;
  scheduled: string;
};

export type ThemePreset = {
  id: string;
  label: string;
  vars: ThemeVars;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "zenwritten",
    label: "zenwritten",
    vars: {
      bg: "#191919",
      fg: "#bbbbbb",
      accent: "#b77e64",
      dim: "#7d7472",
      border: "#3d3839",
      logged: "#b77e64",
      scheduled: "#46cab2",
    },
  },
  {
    id: "amber",
    label: "amber",
    vars: {
      bg: "#0d0b06",
      fg: "#e8c98d",
      accent: "#ffb000",
      dim: "#8a7550",
      border: "#2c2417",
      logged: "#ffb000",
      scheduled: "#7dd6cf",
    },
  },
  {
    id: "phosphor",
    label: "green phosphor",
    vars: {
      bg: "#0a0f0a",
      fg: "#b7d7b0",
      accent: "#33ff66",
      dim: "#5d8562",
      border: "#1b2a1c",
      logged: "#33ff66",
      scheduled: "#7fdfff",
    },
  },
  {
    id: "matrix",
    label: "matrix",
    vars: {
      bg: "#000000",
      fg: "#9ef29e",
      accent: "#00ff41",
      dim: "#3f8a4c",
      border: "#123018",
      logged: "#00ff41",
      scheduled: "#4be0c0",
    },
  },
  {
    id: "ice",
    label: "ice",
    vars: {
      bg: "#0b1016",
      fg: "#cfe3f2",
      accent: "#6cc7ff",
      dim: "#6d8598",
      border: "#1d2a36",
      logged: "#6cc7ff",
      scheduled: "#b28cff",
    },
  },
  {
    id: "solarized",
    label: "solarized",
    vars: {
      bg: "#002b36",
      fg: "#93a1a1",
      accent: "#b58900",
      dim: "#5f7981",
      border: "#073642",
      logged: "#b58900",
      scheduled: "#2aa198",
    },
  },
  {
    id: "mono",
    label: "mono",
    vars: {
      bg: "#101010",
      fg: "#d4d4d4",
      accent: "#ffffff",
      dim: "#7a7a7a",
      border: "#2a2a2a",
      logged: "#ffffff",
      scheduled: "#8a8a8a",
    },
  },
];

export const DEFAULT_PRESET_ID = "zenwritten";

export type ThemeSelection = {
  presetId: string;
  /** Optional custom accent, overriding the preset's accent and logged color. */
  accent?: string;
};

/**
 * What actually goes in storage.
 *
 * The resolved vars are persisted alongside the selection so the no-flash
 * script in the document head can apply the theme before first paint without
 * needing to know the preset table.
 */
type StoredTheme = ThemeSelection & { vars: ThemeVars };

export function isValidHex(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

export function presetById(id: string): ThemePreset {
  return THEME_PRESETS.find((preset) => preset.id === id) ?? THEME_PRESETS[0];
}

export function resolveTheme(selection: ThemeSelection): ThemeVars {
  const base = presetById(selection.presetId).vars;
  const accent = selection.accent;
  if (accent === undefined || !isValidHex(accent)) return base;
  // A custom accent drives the logged-day color too, otherwise picking one
  // would leave the calendar itself unchanged.
  return { ...base, accent, logged: accent };
}

export function loadTheme(): ThemeSelection {
  const stored = read<StoredTheme | null>("theme", null);
  if (stored === null || typeof stored.presetId !== "string") {
    return { presetId: DEFAULT_PRESET_ID };
  }
  return { presetId: stored.presetId, accent: stored.accent };
}

export function saveTheme(selection: ThemeSelection): void {
  const stored: StoredTheme = { ...selection, vars: resolveTheme(selection) };
  write("theme", stored);
}

export function applyTheme(vars: ThemeVars): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(`--${name}`, value);
  }
}

/**
 * Runs in the document head before first paint, so a non-default theme never
 * flashes the default one. Kept in sync with the storage shape above.
 */
export const NO_FLASH_SCRIPT = `(function(){try{var r=localStorage.getItem('trainlog:theme');if(!r)return;var v=JSON.parse(r).vars;if(!v)return;var e=document.documentElement;for(var k in v){e.style.setProperty('--'+k,v[k]);}}catch(e){}})();`;
