// /blog is the single public surface for case studies and essays. It is a view over
// lib/work.ts and lib/posts.ts, not a third copy of either: the content lives where it
// already lived, and this file only decides how the two kinds line up on one page.
import { allWorks, getWork, type Media, type Work, type WorkStatus } from "./work";
import { getPost, publishedPosts, type Post } from "./posts";

export type BlogKind = "case" | "essay";

/** One row in the /blog index. Enough to draw a card, nothing more. */
export type BlogEntry = {
  kind: BlogKind;
  slug: string;
  href: string;
  title: string;
  summary: string;
  kicker: string;
  /** Essays only: ISO YYYY-MM-DD, the same date the essay header prints. */
  date?: string;
  /** Cases only: the cover the /work card already used. */
  cover?: Media;
  status?: WorkStatus;
  outcome?: { value: string; note: string };
};

/** A resolvable /blog/<slug> page, carrying the source record the template renders. */
export type BlogItem =
  | { kind: "case"; href: string; work: Work }
  | { kind: "essay"; href: string; post: Post };

export const blogHref = (slug: string): string => `/blog/${slug}`;

/** Every case study, in case display order. */
export function caseEntries(): BlogEntry[] {
  return allWorks().map((w) => ({
    kind: "case",
    slug: w.slug,
    href: blogHref(w.slug),
    title: w.title,
    summary: w.summary,
    kicker: w.kicker,
    cover: w.cover,
    status: w.status,
    outcome: w.outcome,
  }));
}

/** Every published essay, newest first. */
export function essayEntries(): BlogEntry[] {
  return publishedPosts().map((p) => ({
    kind: "essay",
    slug: p.slug,
    href: blogHref(p.slug),
    title: p.title,
    summary: p.summary,
    kicker: "Essay",
    date: p.date,
  }));
}

/** The index in reading order: cases first, then essays. */
export function blogEntries(): BlogEntry[] {
  return [...caseEntries(), ...essayEntries()];
}

/** Resolve a slug to whichever kind owns it, or undefined for an unknown or draft slug. */
export function getBlogItem(slug: string): BlogItem | undefined {
  const work = getWork(slug);
  if (work) return { kind: "case", href: blogHref(slug), work };
  const post = getPost(slug);
  if (post) return { kind: "essay", href: blogHref(slug), post };
  return undefined;
}
