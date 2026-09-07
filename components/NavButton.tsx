"use client";

import Button from "./ui/Button";

export type NavButtonProps = {
  label: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean;
  /** Accent-filled, matching the today cell in the grid. */
  emphasis?: boolean;
};

/** Desktop header month controls — a thin alias for the shared Button. */
export default function NavButton({ label, onClick, ariaLabel, disabled, emphasis }: NavButtonProps) {
  return (
    <Button
      variant={emphasis ? "primary" : "quiet"}
      size="sm"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {label}
    </Button>
  );
}
