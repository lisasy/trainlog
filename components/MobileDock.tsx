"use client";

import { useEffect, useRef, useState } from "react";
import CurrentCard, { type CurrentCardContentProps } from "./CurrentCard";

const DISMISS_PX = 88;

export type MobileDockProps = CurrentCardContentProps & {
  /** Calendar rests on the stats card; other views hide the card until a form. */
  calendarView: boolean;
  /** Calendar day sheet open: the dock grows into a working sheet. */
  sheetOpen: boolean;
};

/**
 * Phone sheet above the tab bar. The calendar above is content-sized, so this
 * pane fills the leftover — rest (month visible) vs week-focus (one week).
 * Theme hides the calendar column, so grow fills through to the header.
 * The tab bar is a sibling in the page, not part of this pane.
 */
export default function MobileDock({
  calendarView,
  sheetOpen,
  ...card
}: MobileDockProps) {
  const showCard = calendarView || card.themeOpen || card.prSheet !== null;
  const startY = useRef(0);
  const dragging = useRef(false);
  const dyRef = useRef(0);
  const [dy, setDy] = useState(0);
  const [snapping, setSnapping] = useState(false);

  useEffect(() => {
    if (!sheetOpen) {
      dragging.current = false;
      dyRef.current = 0;
      setDy(0);
      setSnapping(false);
    }
  }, [sheetOpen]);

  function isInteractive(target: EventTarget | null) {
    return target instanceof Element && target.closest("button, a, input, textarea, select") !== null;
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!sheetOpen || isInteractive(event.target)) return;
    dragging.current = true;
    startY.current = event.clientY;
    dyRef.current = 0;
    setSnapping(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const next = Math.max(0, event.clientY - startY.current);
    dyRef.current = next;
    setDy(next);
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    if (dyRef.current >= DISMISS_PX) {
      card.onCloseSheet();
      return;
    }
    setSnapping(true);
    setDy(0);
  }

  if (!showCard) return null;

  return (
    <div
      className="sheet-grow-dock pointer-events-none relative z-20 flex min-h-0 flex-col lg:hidden"
      style={{ flexGrow: calendarView || card.themeOpen ? 1 : 0 }}
    >
      <div aria-hidden className="dock-veil pointer-events-none absolute inset-0" />

      <div
        className="pointer-events-auto relative z-10 -mx-4 flex min-h-0 flex-1 flex-col touch-none"
        style={{
          transform: sheetOpen ? `translateY(${dy}px)` : undefined,
          transition: snapping ? "transform var(--sheet-duration) var(--sheet-ease)" : "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <CurrentCard
          showStats={calendarView}
          sheetFill={calendarView || card.themeOpen || card.prSheet !== null}
          bleed
          {...card}
        />
      </div>
    </div>
  );
}
