"use client";

import { useRef, useState } from "react";
import { Dot } from "lucide-react";
import { backupFilename, exportBackup, importBackup } from "@/lib/backup";
import { PRESSABLE } from "@/lib/styles";
import type { PREntry, TrainedDaysMap } from "@/lib/types";
import { isValidHex, THEME_PRESETS, type ThemeSelection } from "@/lib/theme";
import { FormHeader } from "./DayCardContent";

export type ThemeViewProps = {
  selection: ThemeSelection;
  onSelectPreset: (presetId: string) => void;
  onSetAccent: (accent: string | undefined) => void;
  onImported: (data: { trainedDays: TrainedDaysMap; prEntries: PREntry[] }) => void;
  onClose: () => void;
  fill?: boolean;
  scrollClassName?: string;
};

const ACTION = [
  "border border-border px-2 py-1.5",
  PRESSABLE,
  "hover:border-accent hover:text-accent",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
  "disabled:cursor-not-allowed disabled:text-dim/50 disabled:hover:border-border disabled:hover:text-dim/50",
].join(" ");

/**
 * Theme + backup body for CurrentCard. Not a modal — the card shell is the chrome.
 */
export default function ThemeView({
  selection,
  onSelectPreset,
  onSetAccent,
  onImported,
  onClose,
  fill = false,
  scrollClassName,
}: ThemeViewProps) {
  const [hex, setHex] = useState(selection.accent ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const hexIsValid = isValidHex(hex);

  function handleExport() {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFilename();
    link.click();
    URL.revokeObjectURL(url);
    setStatus("exported");
  }

  async function handleImportFile(file: File) {
    const text = await file.text();
    const result = importBackup(text);
    if (!result.ok) {
      setStatus(`import failed: ${result.error}`);
      return;
    }
    onImported({ trainedDays: result.trainedDays, prEntries: result.prEntries });
    setStatus(`imported ${result.dayCount} days, ${result.prCount} prs`);
  }

  const fieldClass =
    "w-full min-w-0 appearance-none rounded-none border border-border bg-transparent px-2 py-1.5 text-fg outline-none placeholder:text-dim focus:border-accent";

  const scroll = fill
    ? "mt-3 min-h-0 flex-1 overflow-y-auto"
    : scrollClassName
      ? `mt-3 overflow-y-auto ${scrollClassName}`
      : "mt-3";

  return (
    <div className={fill ? "flex min-h-0 flex-1 flex-col" : ""}>
      <FormHeader title="theme" onClose={onClose} />

      <div className={scroll}>
        <div className="text-sm text-dim">presets</div>
        <ul className="mt-1">
          {THEME_PRESETS.map((preset) => {
            const isActive = preset.id === selection.presetId;
            return (
              <li key={preset.id}>
                <button
                  type="button"
                  onClick={() => onSelectPreset(preset.id)}
                  aria-pressed={isActive}
                  className={[
                    "flex w-full items-center gap-2 px-2 py-2 text-left",
                    PRESSABLE,
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
                    isActive ? "bg-fg/10 text-fg hover:bg-fg/15" : "text-fg/90 hover:bg-fg/5",
                  ].join(" ")}
                >
                  <span
                    className={`inline-flex items-center ${isActive ? "text-accent" : "text-dim/40"}`}
                    aria-hidden
                  >
                    <Dot size={16} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{preset.label}</span>
                  <span className="flex shrink-0 gap-1" aria-hidden>
                    {[preset.vars.bg, preset.vars.fg, preset.vars.accent, preset.vars.scheduled].map(
                      (color, index) => (
                        <span
                          key={index}
                          className="inline-block h-3 w-3 border border-border"
                          style={{ backgroundColor: color }}
                        />
                      ),
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 text-sm text-dim">custom accent</div>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="text"
            value={hex}
            onChange={(event) => setHex(event.target.value)}
            placeholder="#b77e64"
            aria-label="Custom accent hex"
            autoComplete="off"
            spellCheck={false}
            className={fieldClass}
          />
          <span
            aria-hidden
            className="inline-block h-8 w-8 shrink-0 border border-border"
            style={{ backgroundColor: hexIsValid ? hex : "transparent" }}
          />
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={!hexIsValid}
            onClick={() => onSetAccent(hex.trim())}
            className={ACTION}
          >
            [ apply ]
          </button>
          {selection.accent !== undefined ? (
            <button
              type="button"
              onClick={() => {
                setHex("");
                onSetAccent(undefined);
              }}
              className={ACTION}
            >
              [ reset ]
            </button>
          ) : null}
        </div>

        <div className="mt-5 text-sm text-dim">data</div>
        <p className="mt-1 text-sm text-dim">
          this log lives only in this browser. export to move it to another device or to
          back it up.
        </p>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={handleExport} className={ACTION}>
            [ export ]
          </button>
          <button type="button" onClick={() => fileInput.current?.click()} className={ACTION}>
            [ import ]
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void handleImportFile(file);
            }}
          />
        </div>
        <p className="mt-2 text-sm text-dim">importing replaces everything currently in this browser.</p>

        {status !== null ? (
          <p className="mt-3 text-sm text-accent" role="status">
            {status}
          </p>
        ) : null}
      </div>
    </div>
  );
}
