"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Presentational primitives for the /theme style guide. Kept here so the page
 * file stays content, not layout. None of these are used anywhere else.
 */

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-dotted border-border pt-10">
      <h2 className="text-lg text-fg">
        <span className="text-dim">## </span>
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

/** Muted body copy — the running explanation between demos. */
export function Note({ children }: { children: ReactNode }) {
  return <p className="max-w-[64ch] text-dim">{children}</p>;
}

/** A flagged tension or caveat — same dot-rule vocabulary, accent-marked. */
export function Flag({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-[64ch] border-l-2 border-accent/60 pl-3 text-dim">
      <span className="text-accent">tension&nbsp;·&nbsp;</span>
      {children}
    </p>
  );
}

/** The panel every live demo sits on, so it reads as a specimen, not chrome. */
export function Stage({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="border-b border-dotted border-border bg-surface px-3 py-1.5 text-sm text-dim">
        {label}
      </div>
      <div className="flex flex-wrap items-start gap-4 bg-bg p-4">{children}</div>
    </div>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-surface px-1.5 py-0.5 text-[0.8em] text-fg">{children}</code>
  );
}

/** One row of the token tables: name, literal value, "use it for" note. */
export function Spec({
  name,
  value,
  children,
}: {
  name: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-1 border-b border-dotted border-border py-2 sm:grid-cols-[12rem_9rem_1fr]">
      <span className="text-fg">{name}</span>
      {value !== undefined ? (
        <span className="text-accent">{value}</span>
      ) : (
        <span className="hidden sm:block" />
      )}
      <span className="col-span-2 text-dim sm:col-span-1">{children}</span>
    </div>
  );
}

export function Swatch({
  color,
  name,
  children,
}: {
  color: string;
  name: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-dotted border-border py-2.5">
      <span
        aria-hidden
        className="mt-0.5 h-9 w-9 shrink-0 rounded-lg border border-border"
        style={{ backgroundColor: color }}
      />
      <span className="grid gap-0.5">
        <span className="text-fg">
          {name} <span className="text-accent">{color}</span>
        </span>
        <span className="max-w-[52ch] text-dim">{children}</span>
      </span>
    </div>
  );
}

/** The 4-square preset preview used in the theme picker, reproduced faithfully. */
export function PresetSwatches({ colors }: { colors: string[] }) {
  return (
    <span className="flex shrink-0 gap-1" aria-hidden>
      {colors.map((c, i) => (
        <span
          key={i}
          className="inline-block h-4 w-4 rounded-[3px] border border-border"
          style={{ backgroundColor: c }}
        />
      ))}
    </span>
  );
}

/** Wrapper that re-scopes the theme variables for a live preview subtree. */
export function ThemeScope({
  vars,
  children,
}: {
  vars: Record<string, string>;
  children: ReactNode;
}) {
  const style: CSSProperties = {};
  for (const [k, v] of Object.entries(vars)) {
    (style as Record<string, string>)[`--${k}`] = v;
  }
  return (
    <div style={style} className="rounded-2xl border border-border bg-bg p-4 text-fg">
      {children}
    </div>
  );
}
