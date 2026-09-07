"use client";

import { BookOpen, Calendar, Images, Trophy, type LucideIcon } from "lucide-react";
import { PRESSABLE } from "@/lib/styles";
import { VIEWS, VIEW_SIDEBAR_LABELS, type View } from "@/lib/views";

const VIEW_ICONS: Record<View, LucideIcon> = {
  calendar: Calendar,
  prs: Trophy,
  splits: BookOpen,
  gallery: Images,
};

export type SidebarProps = {
  onOpenTheme: () => void;
  view: View;
  onSelectView: (view: View) => void;
};

/** Desktop left rail: identity and app navigation. */
export default function Sidebar({ onOpenTheme, view, onSelectView }: SidebarProps) {
  return (
    <aside className="hidden w-[15rem] shrink-0 flex-col pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:flex">
      <div className="flex h-11 shrink-0 items-baseline px-4 pt-2">
        <span className="text-dim">&gt;&nbsp;</span>
        <span className="text-accent glow">trainlog</span>
        <span
          className="cursor-block ml-1.5 inline-block h-[0.95em] w-[0.55em] translate-y-[0.1em] bg-accent"
          aria-hidden
        />
      </div>

      <nav aria-label="Views" className="min-h-0 flex-1 px-2 pt-4">
        {VIEWS.map((name) => {
          const active = view === name;
          const Icon = VIEW_ICONS[name];
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelectView(name)}
              aria-current={active ? "true" : undefined}
              className={[
                "mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                PRESSABLE,
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
                active
                  ? "bg-surface text-accent hover:bg-fg/10"
                  : "text-dim hover:bg-fg/5 hover:text-fg",
              ].join(" ")}
            >
              <Icon size={18} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{VIEW_SIDEBAR_LABELS[name]}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex items-baseline justify-between px-4 py-2 text-dim">
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
