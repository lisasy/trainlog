"use client";

export type StreakBadgeProps = {
  /** Consecutive weeks with at least three trained days. */
  weeks: number;
  /** Sidebar form stacks the rule underneath; the mobile header is inline. */
  variant?: "block" | "inline";
};

export default function StreakBadge({ weeks, variant = "inline" }: StreakBadgeProps) {
  const label = weeks === 0 ? "no streak" : `${weeks}w streak`;

  if (variant === "inline") {
    return (
      <span
        className={weeks === 0 ? "text-dim" : "text-logged"}
        title="Consecutive weeks with 3+ training days"
      >
        {label}
      </span>
    );
  }

  return (
    <div className="px-2 py-0.5">
      <div className={weeks === 0 ? "text-dim" : "text-logged"}>{label}</div>
      {/* Spells out the rule, so the number isn't a mystery. */}
      <div className="text-sm text-dim">3+ days a week</div>
    </div>
  );
}
