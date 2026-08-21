"use client";

import { useEffect } from "react";
import type { DateKey, PREntry } from "@/lib/types";
import PRForm, { type PRFormInput } from "./PRForm";

export type PREditSheetProps = {
  /** The entry being edited, or undefined when adding. */
  entry?: PREntry;
  /** Prefilled exercise when adding from a group header. */
  initialExerciseName?: string;
  allEntries: PREntry[];
  todayKey: DateKey;
  onSubmit: (input: PRFormInput) => void;
  onDelete?: () => void;
  onClose: () => void;
};

/**
 * Add/edit drawer for the ledger.
 *
 * Editing happens here rather than by jumping to the calendar — a PR is a
 * record in its own right, and the day it happened on is just one of its
 * fields.
 */
export default function PREditSheet({
  entry,
  initialExerciseName,
  allEntries,
  todayKey,
  onSubmit,
  onDelete,
  onClose,
}: PREditSheetProps) {
  const isEdit = entry !== undefined;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit pr" : "Add pr"}
        className={[
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col border-t border-border bg-bg",
          "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          "lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-[24rem] lg:border-t-0 lg:border-l lg:pb-0",
        ].join(" ")}
      >
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-dotted border-border px-3">
          <span>
            <span className="text-dim">&gt;&nbsp;</span>
            <span className="text-fg">{isEdit ? "edit pr" : "add pr"}</span>
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
          <PRForm
            key={entry?.id ?? initialExerciseName ?? "new"}
            allEntries={allEntries}
            todayKey={todayKey}
            initialExerciseName={entry?.exerciseName ?? initialExerciseName}
            initialWeight={entry === undefined ? undefined : String(entry.weight)}
            initialNote={entry?.note}
            initialDate={entry?.date}
            submitLabel={isEdit ? "[ save ]" : "[ add ]"}
            resetAfterSubmit={!isEdit}
            autoFocus
            onSubmit={onSubmit}
            onCancel={onClose}
          />

          {isEdit && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="link mt-4 cursor-pointer text-sm text-dim hover:text-accent focus-visible:text-accent focus-visible:outline-none"
            >
              delete this pr
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
