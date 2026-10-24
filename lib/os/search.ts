// akibOS Search (the ⌘K palette) — one index over everything on the laptop and the site. Pure, unit-tested.
import { allWorks, getWork } from "../work";
import { notes, photos } from "../desk";
import { apps } from "./apps";
import { displayPath, HOME, listDir, openAction } from "./fs";
import { playItems } from "./playground";
import { sites } from "./sites";
import { COMMANDS } from "./terminal";
import type { FsFile, SearchItem, SearchKind } from "./types";

/** Tie-break order for equal scores. */
export const KIND_ORDER: readonly SearchKind[] = ["app", "project", "page", "note", "file", "photo", "site", "command"];

/**
 * Project folder name (folded, letters and digits only) to its case-study slug. Explicit on purpose: the folder names
 * are the fs worker's, the slugs are fixed by the plan. A folder not listed here falls back to matching a slug directly.
 */
const PROJECT_SLUGS: Record<string, string> = {
  videostudio: "video-studio", videoplatform: "video-studio", aivideostudio: "video-studio", aivideogenerationplatform: "video-studio",
  photobooth: "photobooth", aiphotobooth: "photobooth",
  lessonpipeline: "lesson-pipeline", ailessonpipeline: "lesson-pipeline", lessons: "lesson-pipeline",
  zoombackup: "zoom-backup", zoomrecordingbackup: "zoom-backup", zoom: "zoom-backup", zoomrecordingautomation: "zoom-backup",
  workoutplanner: "workout-planner", workout: "workout-planner", aiworkoutplanner: "workout-planner",
  culinarycompanion: "culinary-companion", culinary: "culinary-companion",
  agentquest: "agent-quest", creativeaiagentquest: "agent-quest",
  loopcraft: "loopcraft",
  gravitywars: "gravity-wars",
  leyci: "leyci", leycistore: "leyci", leycistorefront: "leyci",
  shortestpath: "shortest-path", shortestpathengine: "shortest-path",
  twinklestar: "twinkle-star",
};

const PAGES: { id: string; title: string; href: string; keywords: string[]; newTab?: boolean }[] = [
  { id: "home", title: "Home", href: "/", keywords: ["portfolio", "start"] },
  { id: "work", title: "All work", href: "/blog", keywords: ["case studies", "projects", "index"] },
  { id: "sound", title: "Sound", href: "/#sound", keywords: ["audio", "music"] },
  { id: "about", title: "About", href: "/#about", keywords: ["me", "bio", "akib"] },
  { id: "cv", title: "CV", href: "/akib-arifeen-cv.pdf", keywords: ["resume", "pdf"], newTab: true },
];

function slugOf(folderName: string): string | undefined {
  const key = fold(folderName).replace(/[^a-z0-9]/g, "");
  return PROJECT_SLUGS[key] ?? allWorks().find((w) => w.slug.replace(/-/g, "") === key)?.slug;
}

/** Every file below `dir`, depth first. */
function walkFiles(dir: string, out: { path: string; folder: string; file: FsFile }[]) {
  for (const node of listDir(dir) ?? []) {
    const path = `${dir}/${node.name}`;
    if (node.kind === "folder") walkFiles(path, out);
    else out.push({ path, folder: dir, file: node });
  }
}

/**
 * Everything searchable, with unique ids: every registry app, every project folder and every case study in
 * lib/work.ts (opening /blog/<slug>), every note, photo, browser site, playground item and terminal command, every file
 * on the laptop outside Projects, and the site's own pages (Home, Work, Sound, About, the CV PDF).
 */
export function buildIndex(): SearchItem[] {
  const items: SearchItem[] = [];
  const seen = new Set<string>();
  const add = (item: SearchItem) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    items.push(item);
  };

  for (const a of apps) {
    add({ id: `app:${a.id}`, kind: "app", title: a.name, subtitle: a.blurb, keywords: [a.id], action: { type: "open", app: a.id } });
  }

  const covered = new Set<string>();
  const projectsDir = `${HOME}/Projects`;
  for (const node of listDir(projectsDir) ?? []) {
    if (node.kind !== "folder") continue;
    const slug = slugOf(node.name);
    const work = slug ? getWork(slug) : undefined;
    const hasWork = !!slug && !!work;
    if (slug && hasWork) covered.add(slug);
    add({
      id: `project:${node.name}`,
      kind: "project",
      title: node.name,
      subtitle: "Project",
      keywords: slug ? [slug, ...(work?.stack ?? [])] : undefined,
      action: slug && hasWork ? { type: "href", href: `/blog/${slug}` } : { type: "open", app: "files", arg: { path: `${projectsDir}/${node.name}` } },
    });
  }

  for (const w of allWorks()) {
    if (covered.has(w.slug)) continue;
    add({ id: `work:${w.slug}`, kind: "page", title: w.title, subtitle: "Case study", keywords: [w.slug, ...w.stack], action: { type: "href", href: `/blog/${w.slug}` } });
  }

  for (const n of notes) {
    add({ id: `note:${n.id}`, kind: "note", title: n.title, subtitle: n.date, action: { type: "open", app: "notes", arg: { noteId: n.id } } });
  }

  const files: { path: string; folder: string; file: FsFile }[] = [];
  for (const node of listDir(HOME) ?? []) {
    const path = `${HOME}/${node.name}`;
    if (node.name === "Projects") continue;
    if (node.kind === "folder") walkFiles(path, files);
    else files.push({ path, folder: HOME, file: node });
  }
  for (const { path, folder, file } of files) {
    add({ id: `file:${path}`, kind: "file", title: file.name, subtitle: displayPath(folder), action: openAction(file, path) });
  }

  photos.forEach((p, i) => {
    add({ id: `photo:${i}`, kind: "photo", title: p.caption, subtitle: p.date, action: { type: "open", app: "photos", arg: { photoIndex: i } } });
  });

  for (const s of sites) {
    add({ id: `site:${s.id}`, kind: "site", title: s.title, subtitle: s.blurb, keywords: [s.url.replace(/^https?:\/\//, "")], action: { type: "open", app: "browser", arg: { url: s.url } } });
  }

  for (const g of playItems) {
    add({ id: `play:${g.slug}`, kind: "project", title: g.name, subtitle: "Playground", keywords: [g.slug], action: { type: "open", app: "playground", arg: { game: g.slug } } });
  }

  for (const c of COMMANDS) {
    add({ id: `command:${c}`, kind: "command", title: c, subtitle: undefined, action: { type: "open", app: "terminal", arg: { command: c } } });
  }

  for (const p of PAGES) {
    add({ id: `page:${p.id}`, kind: "page", title: p.title, keywords: p.keywords, action: { type: "href", href: p.href, ...(p.newTab ? { newTab: true } : {}) } });
  }

  return items;
}

/** Lowercase, Unicode NFD with combining marks removed, whitespace collapsed and trimmed. "  Léyci  Store " → "leyci store". */
export function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function scoreWord(word: string, whole: string, multi: boolean, title: string, titleWords: string[], keywords: string[], subtitle: string): number {
  if (multi ? title === whole : title === word) return 100;
  if (title.startsWith(word)) return 80;
  if (titleWords.some((t) => t.startsWith(word))) return 60;
  if (title.includes(word)) return 40;
  if (keywords.some((k) => k.startsWith(word))) return 30;
  if (subtitle.includes(word)) return 15;
  return 0;
}

/**
 * Rank `items` for `query`. Empty or whitespace-only query → [].
 * The query is folded and split into words. Per word, its score against an item is the best of:
 *   100 the folded title equals the word · 80 the title starts with it · 60 any word of the title starts with it ·
 *   40 the title contains it · 30 any keyword starts with it · 15 the subtitle contains it · otherwise 0.
 * (A single-word query is compared as one word; for multi-word queries "title equals" means title === the whole query.)
 * An item is kept only when every word scores > 0; its score is the sum over words.
 * Sort by score descending, then KIND_ORDER, then title A→Z (localeCompare). Return at most `limit` items (default 8).
 */
export function searchItems(query: string, items: readonly SearchItem[], limit = 8): SearchItem[] {
  const whole = fold(query);
  if (!whole) return [];
  const words = whole.split(" ");
  const multi = words.length > 1;
  const scored: { item: SearchItem; score: number }[] = [];
  for (const item of items) {
    const title = fold(item.title);
    const titleWords = title.split(" ");
    const keywords = (item.keywords ?? []).map(fold);
    const subtitle = fold(item.subtitle ?? "");
    let total = 0;
    for (const w of words) {
      const sc = scoreWord(w, whole, multi, title, titleWords, keywords, subtitle);
      if (sc === 0) { total = 0; break; }
      total += sc;
    }
    if (total > 0) scored.push({ item, score: total });
  }
  scored.sort((a, b) =>
    b.score - a.score ||
    KIND_ORDER.indexOf(a.item.kind) - KIND_ORDER.indexOf(b.item.kind) ||
    a.item.title.localeCompare(b.item.title));
  return scored.slice(0, limit).map((s) => s.item);
}
