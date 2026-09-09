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

/** Large page titles — same type as the calendar month. */
export const VIEW_PAGE_TITLES: Record<Exclude<View, "calendar">, string> = {
  prs: "PRs",
  splits: "Splits",
  gallery: "Gallery",
};

/** Icon-nav hover labels. */
export const VIEW_NAV_TITLES: Record<View, string> = {
  calendar: "Calendar",
  prs: "PRs",
  splits: "Splits",
  gallery: "Gallery",
};
