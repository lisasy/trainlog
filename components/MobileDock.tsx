"use client";

import type { View } from "@/lib/views";
import BottomNav from "./BottomNav";
import CurrentCard, { type CurrentCardContentProps } from "./CurrentCard";

export type MobileDockProps = CurrentCardContentProps & {
  /** Calendar rests on the stats card; other views hide the card until a form. */
  calendarView: boolean;
  view: View;
  onSelectView: (view: View) => void;
};

/**
 * Phone: one CurrentCard floating on the dock. Body swaps in place; height
 * hugs content. Not a fill-the-gap sheet.
 */
export default function MobileDock({
  calendarView,
  view,
  onSelectView,
  ...card
}: MobileDockProps) {
  const showCard =
    calendarView || card.themeOpen || card.prSheet !== null;

  return (
    <div className="pointer-events-none sticky bottom-0 z-20 shrink-0 lg:hidden">
      {showCard ? (
        <div aria-hidden className="dock-veil pointer-events-none absolute inset-0" />
      ) : null}

      <div className="pointer-events-auto relative z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {showCard ? <CurrentCard showStats={calendarView} {...card} /> : null}

        <BottomNav view={view} onSelectView={onSelectView} />
      </div>
    </div>
  );
}
