"use client";

import type { ComponentPropsWithRef } from "react";

export type FieldProps = ComponentPropsWithRef<"input">;

/**
 * The one text-input style. `text-base` (16px) is deliberate and load-bearing:
 * anything smaller makes iOS Safari zoom the page on focus. Hierarchy in forms
 * comes from the section label above the field, not from shrinking the field.
 *
 * `type="date"` gets `color-scheme: dark` so the native picker matches; pass it
 * like any other input.
 */
const FIELD =
  "w-full min-w-0 appearance-none rounded-lg border border-border bg-bg/40 px-3 py-2 text-base text-fg " +
  "outline-none transition-colors placeholder:text-dim focus:border-accent " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export default function Field({ type = "text", className = "", style, ...rest }: FieldProps) {
  return (
    <input
      type={type}
      className={[FIELD, className].join(" ")}
      style={type === "date" ? { colorScheme: "dark", ...style } : style}
      {...rest}
    />
  );
}
