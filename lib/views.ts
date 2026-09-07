/** The app's top-level views, in the order the bottom nav lists them. */
export const VIEWS = ["calendar", "prs", "splits", "gallery"] as const;

export type View = (typeof VIEWS)[number];

/** What each view is called in the UI — the internal names predate the nav. */
export const VIEW_LABELS: Record<View, string> = {
  calendar: "log",
  prs: "pr",
  splits: "splits",
  gallery: "gallery",
};

/** Desktop sidebar — matches the intended icon rail. */
export const VIEW_SIDEBAR_LABELS: Record<View, string> = {
  calendar: "calendar",
  prs: "prs",
  splits: "splits",
  gallery: "gallery",
};
