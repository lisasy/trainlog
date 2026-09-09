"use client";

import type { View } from "@/lib/views";
import BottomNav from "./BottomNav";
import CurrentCard, { type CurrentCardContentProps } from "./CurrentCard";

export type MobileDockProps = CurrentCardContentProps & {
  /** Calendar rests on the stats card; other views hide the card until a form. */
  calendarView: boolean;
  /** Calendar day sheet open: the dock grows into a working sheet. */
  sheetOpen: boolean;
  view: View;
  onSelectView: (view: View) => void;
};

/**
 * Phone: one CurrentCard floating on the dock. Body swaps in place. At rest
 * the card hugs its content; while a calendar day sheet is open the dock
 * trades flex-grow with the calendar column and the card grows to a stable
 * working height.
 */
export default function MobileDock({
  calendarView,
  sheetOpen,
  view,
  onSelectView,
  ...card
}: MobileDockProps) {
  const showCard = calendarView || card.themeOpen || card.prSheet !== null;

  return (
    <div
      className="sheet-grow-dock pointer-events-none sticky bottom-0 z-20 shrink-0 lg:hidden"
      style={{ flexGrow: sheetOpen ? 1 : 0 }}
    >
      {showCard ? (
        <div aria-hidden className="dock-veil pointer-events-none absolute inset-0" />
      ) : null}

      <div className="pointer-events-auto relative z-10 flex min-h-0 flex-col justify-end pb-[max(1rem,env(safe-area-inset-bottom))]">
        {showCard ? (
          <CurrentCard showStats={calendarView} sheetFill={sheetOpen} {...card} />
        ) : null}

        <BottomNav view={view} onSelectView={onSelectView} />
      </div>
    </div>
  );
}
