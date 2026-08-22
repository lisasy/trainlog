"use client";

import { useEffect, useRef, useState } from "react";
import { backupFilename, exportBackup, importBackup } from "@/lib/backup";
import type { PREntry, TrainedDaysMap } from "@/lib/types";
import { isValidHex, THEME_PRESETS, type ThemeSelection } from "@/lib/theme";

export type ThemePickerProps = {
  selection: ThemeSelection;
  onSelectPreset: (presetId: string) => void;
  onSetAccent: (accent: string | undefined) => void;
  onImported: (data: { trainedDays: TrainedDaysMap; prEntries: PREntry[] }) => void;
  onClose: () => void;
};

export default function ThemePicker({
  selection,
  onSelectPreset,
  onSetAccent,
  onImported,
  onClose,
}: ThemePickerProps) {
  const [hex, setHex] = useState(selection.accent ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Theme"
        className={[
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col border-t border-border bg-bg",
          "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          "lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-[24rem] lg:border-t-0 lg:border-l lg:pb-0",
        ].join(" ")}
      >
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-dotted border-border px-3">
          <span>
            <span className="text-dim">&gt;&nbsp;</span>
            <span className="text-fg">theme</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-dim hover:text-accent focus-visible:text-accent focus-visible:outline-none"
          >
            [ esc ]
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
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
                      "flex w-full cursor-pointer items-center gap-2 px-2 py-2 text-left",
                      isActive ? "bg-fg/10 text-fg" : "text-fg/90 hover:bg-fg/5",
                    ].join(" ")}
                  >
                    <span className={isActive ? "text-accent" : "text-dim/40"} aria-hidden>
                      ▪
                    </span>
                    <span className="min-w-0 flex-1 truncate">{preset.label}</span>
                    {/* Swatches render from the preset's own values, not from
                        the active theme's variables. */}
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
              className="cursor-pointer border border-border px-2 py-1.5 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:text-dim/50 disabled:hover:border-border disabled:hover:text-dim/50"
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
                className="cursor-pointer border border-border px-2 py-1.5 text-dim hover:border-accent hover:text-accent"
              >
                [ reset ]
              </button>
            ) : null}
          </div>

          <div className="mt-5 text-sm text-dim">data</div>
          <p className="mt-1 text-sm text-dim">
            this log lives only in this browser. export to move it to another
            device or to back it up.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="cursor-pointer border border-border px-2 py-1.5 hover:border-accent hover:text-accent"
            >
              [ export ]
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="cursor-pointer border border-border px-2 py-1.5 hover:border-accent hover:text-accent"
            >
              [ import ]
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                // Reset so re-picking the same file fires change again.
                event.target.value = "";
                if (file) void handleImportFile(file);
              }}
            />
          </div>
          <p className="mt-2 text-sm text-dim">
            importing replaces everything currently in this browser.
          </p>

          {status !== null ? (
            <p className="mt-3 text-sm text-accent" role="status">
              {status}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
