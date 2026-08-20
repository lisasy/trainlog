"use client";

import { useCallback, useRef } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";

type Options = {
  onLongPress: () => void;
  onClick: () => void;
  delayMs?: number;
};

/**
 * Tap vs. press-and-hold on one target.
 *
 * Touch and pen get the hold timer; a mouse doesn't, because holding a mouse
 * button is not a gesture anyone performs on purpose — desktop uses the
 * context menu (right-click) for the same intent instead.
 */
export function useLongPress({ onLongPress, onClick, delayMs = 450 }: Options) {
  const timer = useRef<number | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    origin.current = null;
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent) => {
      if (event.pointerType === "mouse") return;
      suppressClick.current = false;
      origin.current = { x: event.clientX, y: event.clientY };
      timer.current = window.setTimeout(() => {
        timer.current = null;
        // The click that follows this pointerup is part of the hold, not a tap.
        suppressClick.current = true;
        onLongPress();
      }, delayMs);
    },
    [delayMs, onLongPress],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent) => {
      const start = origin.current;
      if (start === null) return;
      // Travel means the finger is scrolling the page, not pressing the cell.
      if (Math.abs(event.clientX - start.x) > 10 || Math.abs(event.clientY - start.y) > 10) {
        cancel();
      }
    },
    [cancel],
  );

  const handleClick = useCallback(() => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    onClick();
  }, [onClick]);

  const handleContextMenu = useCallback(
    (event: ReactMouseEvent) => {
      event.preventDefault();
      onLongPress();
    },
    [onLongPress],
  );

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onClick: handleClick,
    onContextMenu: handleContextMenu,
  };
}
