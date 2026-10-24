// Personal writing (/writing/<slug>) contract. Bodies are scaffolding until Task 3.
import type { Block } from "./work";

export type Post = {
  slug: string;            // kebab-case, unique
  title: string;
  date: string;            // ISO YYYY-MM-DD
  summary: string;         // one or two sentences for the index
  blocks: Block[];
  relatedWork: string;     // /work/<slug>
  liveUrl?: string;        // only where a public build exists
  /** Unfinished: hidden from every route, index, sitemap and link until removed. */
  draft?: boolean;
};

const SCAFFOLDING =
  "Scaffolding copy for Task 1. The essay text and its claim ledger land in Task 3. Do not publish this paragraph.";

/** Every post, drafts included, in the order they were written. */
export const posts: Post[] = [
  {
    slug: "the-room-had-no-bright-pixels",
    title: "The room had no bright pixels",
    date: "2026-10-24",
    summary: "Scaffolding summary for Task 1. Final copy lands in Task 3.",
    blocks: [{ kind: "prose", paras: [SCAFFOLDING] }],
    relatedWork: "save-your-princess",
  },
  {
    slug: "the-queue-that-waits-for-ram",
    title: "The queue that waits for RAM",
    date: "2026-10-24",
    summary: "Scaffolding summary for Task 1. Final copy lands in Task 3.",
    blocks: [{ kind: "prose", paras: [SCAFFOLDING] }],
    relatedWork: "video-studio",
  },
  {
    slug: "when-the-photo-booth-had-to-just-work",
    title: "When the photo booth had to just work",
    date: "2026-10-24",
    summary: "Scaffolding summary for Task 1. Final copy lands in Task 3.",
    blocks: [{ kind: "prose", paras: [SCAFFOLDING] }],
    relatedWork: "photobooth",
  },
];

/** Published posts (drafts excluded), newest first. */
export function publishedPosts(): Post[] {
  return posts
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** A published post, or undefined for unknown and draft slugs. */
export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug && !p.draft);
}

/** "24 October 2026" for headers. UTC so the build output never depends on the server timezone. */
export function formatPostDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}
