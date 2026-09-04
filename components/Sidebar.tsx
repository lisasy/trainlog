"use client";

import { VIEWS, VIEW_LABELS, type View } from "@/lib/views";

export type SidebarProps = {
  onOpenTheme: () => void;
  view: View;
  onSelectView: (view: View) => void;
};

/** Desktop left rail: identity and app navigation. */
export default function Sidebar({ onOpenTheme, view, onSelectView }: SidebarProps) {
  return (
    <aside className="hidden w-[15rem] shrink-0 flex-col border-r border-dotted border-border pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm lg:flex">
      {/* h-11 matches the body header exactly, so this bottom border and the
          body's land on the same line. */}
      <div className="flex h-11 shrink-0 items-baseline border-b border-dotted border-border px-3 pt-2">
        <span className="text-dim">&gt;&nbsp;</span>
        <span className="text-accent glow">trainlog</span>
        <span
          className="cursor-block ml-1.5 inline-block h-[0.95em] w-[0.55em] translate-y-[0.1em] bg-accent"
          aria-hidden
        />
      </div>

      <nav aria-label="Views" className="min-h-0 flex-1 px-1 pt-2">
        <div className="px-2 pb-1 text-dim">view</div>
        {VIEWS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onSelectView(name)}
            aria-current={view === name ? "true" : undefined}
            className={[
              "flex w-full cursor-pointer items-baseline gap-2 px-2 py-0.5 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent",
              view === name ? "bg-fg/10 text-fg" : "text-fg/90 hover:bg-fg/5",
            ].join(" ")}
          >
            <span className="min-w-0 flex-1 truncate">{VIEW_LABELS[name]}</span>
          </button>
        ))}
      </nav>

      <div className="flex items-baseline justify-between border-t border-dotted border-border px-3 py-1 text-dim">
        <span>get strong</span>
        <button
          type="button"
          onClick={onOpenTheme}
          className="link cursor-pointer text-dim transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
        >
          theme
        </button>
      </div>
    </aside>
  );
}
