"use client";

import { BookOpen, Calendar, Images, Trophy, type LucideIcon } from "lucide-react";
import { FOCUS_RING, PRESSABLE } from "@/lib/styles";
import { VIEWS, VIEW_LABELS, type View } from "@/lib/views";

const VIEW_ICONS: Record<View, LucideIcon> = {
  calendar: Calendar,
  prs: Trophy,
  splits: BookOpen,
  gallery: Images,
};

export type BottomNavProps = {
  view: View;
  onSelectView: (view: View) => void;
};

/** Phone-only tab bar. Floats as its own card at the foot of the screen. */
export default function BottomNav({ view, onSelectView }: BottomNavProps) {
  return (
    <nav
      aria-label="Views"
      className="mx-auto mt-2 flex w-fit shrink-0 gap-1 rounded-2xl bg-surface p-2 lg:hidden"
    >
      {VIEWS.map((name) => {
        const active = view === name;
        const Icon = VIEW_ICONS[name];
        return (
          <button
            key={name}
            type="button"
            onClick={() => onSelectView(name)}
            aria-current={active ? "page" : undefined}
            aria-label={VIEW_LABELS[name]}
            className={[
              "tap-target flex items-center justify-center rounded-xl px-4 py-3",
              PRESSABLE,
              FOCUS_RING,
              active ? "bg-fg/10 text-fg hover:bg-fg/15" : "text-dim hover:bg-fg/5 hover:text-accent",
            ].join(" ")}
          >
            <Icon size={22} aria-hidden />
          </button>
        );
      })}
    </nav>
  );
}
