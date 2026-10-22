// Case studies (/work/<slug>) — the contract. Content lives in lib/work-content.ts. Numbers only from WORK_RECORD.md.
import { works } from "./work-content";

export type Media =
  | { kind: "image"; src: string; alt: string; w: number; h: number; caption?: string }
  /** Muted, inline, looping when `loop`; always has a poster so nothing jumps while it loads. */
  | { kind: "video"; src: string; poster: string; w: number; h: number; caption?: string; loop?: boolean }
  | { kind: "embed"; src: string; title: string; aspect: string; allow?: string; caption?: string };

export type CodeLang = "ts" | "tsx" | "java" | "python" | "bash" | "json" | "sql" | "css";

export type Block =
  | { kind: "prose"; heading?: string; paras: string[] }
  /** A real, scrubbed excerpt. `source` names where it came from (repo · file), never a private URL or secret. */
  | { kind: "code"; heading?: string; lang: CodeLang; code: string; caption: string; source: string }
  | { kind: "media"; heading?: string; items: Media[] }
  | { kind: "steps"; heading?: string; items: { title: string; body: string }[] }
  | { kind: "decisions"; heading?: string; items: { choice: string; why: string; cost: string }[] }
  | { kind: "facts"; heading?: string; items: { value: string; label: string; note?: string }[] };

export type WorkStatus = "shipped" | "in production" | "in progress" | "concept" | "prototype" | "rebuilding";

export type Work = {
  slug: string;            // kebab-case, unique
  title: string;
  kicker: string;          // "See Change Education · 2026"
  summary: string;         // one or two sentences: what it is and why it matters
  role: string;            // what Akib did
  when: string;
  team?: string;
  stack: string[];
  status: WorkStatus;
  outcome?: { value: string; note: string };
  links: { label: string; href: string }[];
  cover: Media;
  blocks: Block[];
  playSlug?: string;       // /play/<slug> when it runs inside the site
  related?: string[];      // other slugs
  /** Unfinished: hidden from every route, index, search and link until removed. */
  draft?: boolean;
};

/** Published case studies (drafts excluded), in display order. */
export function allWorks(): Work[] {
  return works.filter((w) => !w.draft);
}

/** A published case study, or undefined for unknown and draft slugs. */
export function getWork(slug: string): Work | undefined {
  return works.find((w) => w.slug === slug && !w.draft);
}
