// The /projects catalog: every project once, grouped by what it is for, with the status it
// honestly has. Names, one-liners and statuses come from the case studies and the playground;
// this file only adds the category and the links that genuinely exist.
import { allWorks, type WorkStatus } from "./work";
import { playItems } from "./os/playground";
import type { PlayItem } from "./os/types";

export type ProjectStatus = WorkStatus | "retired";

export type ProjectCategoryId = "products" | "games" | "experiments";

export type ProjectCategory = { id: ProjectCategoryId; title: string; blurb: string };

export type ProjectEntry = {
  slug: string;
  name: string;
  line: string;
  category: ProjectCategoryId;
  status: ProjectStatus;
  /** The case study, where one is written. */
  caseStudy?: string;
  /** The slice that runs inside this site, where one exists. */
  play?: string;
};

export const CATEGORIES: ProjectCategory[] = [
  { id: "products", title: "Products", blurb: "Built for someone else to use." },
  { id: "games", title: "Games", blurb: "Interactive worlds." },
  { id: "experiments", title: "Experiments", blurb: "Self-initiated, built to find out whether an idea holds up." },
];

/** One decision per project. Everything else about it is read from where it is already written. */
const CATEGORY_BY_SLUG: Record<string, ProjectCategoryId> = {
  "video-studio": "products",
  photobooth: "products",
  "lesson-pipeline": "products",
  "zoom-backup": "products",
  "workout-planner": "products",
  leyci: "products",
  "twinkle-star": "products",
  "shortest-path": "products",
  loopcraft: "products",
  "gravity-wars": "games",
  "save-your-princess": "games",
  "agent-quest": "experiments",
  "culinary-companion": "experiments",
  "portfolio-v1": "experiments",
};

/** The playground keeps its own state word; these are the same facts in the project vocabulary. */
const PLAY_STATUS: Record<PlayItem["status"], ProjectStatus> = {
  playable: "shipped",
  beta: "prototype",
  rebuilding: "rebuilding",
  retired: "retired",
};

export function projectEntries(): ProjectEntry[] {
  const fromCases: ProjectEntry[] = allWorks().map((w) => ({
    slug: w.slug,
    name: w.title,
    line: w.summary,
    category: CATEGORY_BY_SLUG[w.slug],
    status: w.status,
    caseStudy: `/blog/${w.slug}`,
    play: w.playSlug ? `/play/${w.playSlug}` : undefined,
  }));

  const fromPlayground: ProjectEntry[] = playItems
    .filter((p) => !p.workSlug)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      line: p.blurb,
      category: CATEGORY_BY_SLUG[p.slug],
      status: PLAY_STATUS[p.status],
      play: p.embeddable ? `/play/${p.slug}` : undefined,
    }));

  return [...fromCases, ...fromPlayground];
}

/** The entries in one category, in catalog order. */
export function projectsIn(category: ProjectCategoryId): ProjectEntry[] {
  return projectEntries().filter((p) => p.category === category);
}

/** What `/projects?show=` can select: one category, the media gallery, or everything. */
export type ProjectShow = "all" | ProjectCategoryId | "media";

/** `?show=` is a URL, so it can be anything; only the known values select anything. */
export function resolveShow(value: string | undefined): ProjectShow {
  if (value === "media") return "media";
  return value === "products" || value === "games" || value === "experiments" ? value : "all";
}
