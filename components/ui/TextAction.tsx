"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type TextActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

/**
 * A bare-text action — for controls that would otherwise read as a label
 * ("close", "clear this day", "theme"). The `.link` class (app/globals.css)
 * gives the dotted underline that goes solid on hover/focus; this wraps it
 * with the pointer + colour shift so call sites stop re-typing the tail.
 */
export default function TextAction({ type = "button", className = "", children, ...rest }: TextActionProps) {
  return (
    <button
      type={type}
      className={[
        "link cursor-pointer text-dim transition-colors",
        "hover:text-accent focus-visible:text-accent focus-visible:outline-none",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
