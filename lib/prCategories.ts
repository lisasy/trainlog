/**
 * Muscle-group buckets for the PR screen chips. Exercises are freeform, so
 * this is a keyword guess — unknown names still show under All.
 */

export const PR_CATEGORIES = ["all", "arms", "back", "legs", "glutes", "core"] as const;

export type PRCategory = (typeof PR_CATEGORIES)[number];

export const PR_CATEGORY_LABELS: Record<PRCategory, string> = {
  all: "all",
  arms: "arms",
  back: "back",
  legs: "legs",
  glutes: "glutes",
  core: "core",
};

const RULES: { category: Exclude<PRCategory, "all">; needles: string[] }[] = [
  { category: "glutes", needles: ["hip thrust", "glute", "kickback"] },
  { category: "core", needles: ["core", "plank", "crunch", "dead bug"] },
  {
    category: "arms",
    needles: [
      "curl",
      "tricep",
      "bicep",
      "shoulder press",
      "overhead press",
      "lateral raise",
      "rear delt",
      "farmers carry",
      "farmer",
    ],
  },
  {
    category: "back",
    needles: ["deadlift", "row", "lat pull", "pulldown", "pull-up", "pullup", "chin"],
  },
  {
    category: "legs",
    needles: ["squat", "lunge", "leg press", "rdl", "romanian", "hamstring", "quad", "calf"],
  },
];

export function categoryForExercise(name: string): Exclude<PRCategory, "all"> | null {
  const lower = name.trim().toLowerCase();
  for (const rule of RULES) {
    if (rule.needles.some((needle) => lower.includes(needle))) return rule.category;
  }
  return null;
}

export function exerciseInCategory(name: string, category: PRCategory): boolean {
  if (category === "all") return true;
  return categoryForExercise(name) === category;
}

/** Display date on a win card, e.g. 09/04. Empty dates stay a dash. */
export function prCardDate(date: string): string {
  if (date === "" || date.length < 10) return "—";
  return `${date.slice(5, 7)}/${date.slice(8, 10)}`;
}
