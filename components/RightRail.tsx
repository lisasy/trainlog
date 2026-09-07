"use client";

import CurrentCard, { type CurrentCardContentProps } from "./CurrentCard";

/**
 * Desktop siderail. Same CurrentCard as the phone dock, always mounted, filling
 * the column. Body swaps: stats, day, ledger PR, theme.
 */
export default function RightRail(props: CurrentCardContentProps) {
  return (
    <aside className="hidden w-[23rem] shrink-0 flex-col p-3 lg:flex">
      <CurrentCard fill statsDirection="col" showStats {...props} />
    </aside>
  );
}
