"use client";

export type StreakBadgeProps = {
  /** Consecutive weeks with at least three trained days. */
  weeks: number;
};

export default function StreakBadge({ weeks }: StreakBadgeProps) {
  if (weeks === 0) {
    return (
      <span className="text-dim" title="3+ training days in a week starts a streak">
        no streak
      </span>
    );
  }

  return (
    <span className="text-logged" title="Consecutive weeks with 3+ training days">
      {weeks}w streak
    </span>
  );
}
